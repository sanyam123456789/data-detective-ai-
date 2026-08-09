"""
AI Intelligence Layer — System instructions and prompt templates.

All prompts are designed to:
  - Accept compact structured profiling context (not raw CSV)
  - Return valid JSON matching the defined Pydantic schemas
  - Make only claims supported by the profiling data
  - Clearly distinguish observations from recommendations
"""
import json
from typing import Dict, Any


# ─────────────────────────────────────────────────
#  Context builder — converts profile dict → compact context
# ─────────────────────────────────────────────────

def build_dataset_context(profile_data: Dict[str, Any]) -> str:
    """
    Builds a compact structured text context from Phase 2A profiling results.
    Only includes meaningful fields; never sends raw CSV data.
    """
    ctx_parts = []

    ctx_parts.append("=== DATASET PROFILE CONTEXT ===")
    ctx_parts.append(f"Total rows: {profile_data.get('total_rows', 'unknown')}")
    ctx_parts.append(f"Total columns: {profile_data.get('total_columns', 'unknown')}")
    ctx_parts.append(f"Health score: {profile_data.get('health_score', 'unknown')}/100")
    ctx_parts.append(f"Total missing values: {profile_data.get('total_missing_values', 0)}")
    ctx_parts.append(f"Total duplicate rows: {profile_data.get('total_duplicate_rows', 0)}")
    ctx_parts.append(f"Duplicate percentage: {profile_data.get('duplicate_percentage', 0):.2f}%")
    ctx_parts.append(f"Total outliers (IQR): {profile_data.get('total_outliers', 0)}")
    ctx_parts.append(f"Total invalid dates: {profile_data.get('total_invalid_dates', 0)}")
    ctx_parts.append(f"Memory usage: {profile_data.get('memory_usage_bytes', 0)} bytes")

    breakdown = profile_data.get("health_breakdown", [])
    if breakdown:
        ctx_parts.append("\nHealth score deductions:")
        for item in breakdown:
            ctx_parts.append(f"  - {item}")

    columns = profile_data.get("columns", {})
    if columns:
        ctx_parts.append(f"\nColumn names: {', '.join(list(columns.keys()))}")
        ctx_parts.append("\nPer-column statistics:")
        for col_name, col_data in columns.items():
            col_ctx = _build_column_context(col_name, col_data)
            ctx_parts.append(col_ctx)

    return "\n".join(ctx_parts)


def _build_column_context(col_name: str, col_data: Dict[str, Any]) -> str:
    """Builds a compact per-column context string."""
    parts = [f"\n  [{col_name}]"]
    parts.append(f"    Type: {col_data.get('inferred_type', 'unknown')}")
    parts.append(f"    Missing: {col_data.get('null_count', 0)} ({col_data.get('missing_percentage', 0):.1f}%)")
    parts.append(f"    Unique values: {col_data.get('unique_values', 0)}")
    parts.append(f"    Duplicates: {col_data.get('duplicate_values', 0)}")

    col_type = col_data.get("inferred_type", "")

    if col_type in ("Integer", "Float"):
        parts.append(f"    Mean: {col_data.get('mean', 'N/A'):.4g}" if col_data.get('mean') is not None else "    Mean: N/A")
        parts.append(f"    Median: {col_data.get('median', 'N/A'):.4g}" if col_data.get('median') is not None else "    Median: N/A")
        parts.append(f"    Min/Max: {col_data.get('min', 'N/A')} / {col_data.get('max', 'N/A')}")
        parts.append(f"    Std dev: {col_data.get('std_dev', 'N/A'):.4g}" if col_data.get('std_dev') is not None else "    Std dev: N/A")
        parts.append(f"    Outliers (IQR): {col_data.get('outlier_count', 0)}")
        parts.append(f"    IQR bounds: [{col_data.get('lower_bound', 'N/A'):.4g}, {col_data.get('upper_bound', 'N/A'):.4g}]" 
                     if col_data.get('lower_bound') is not None else "    IQR bounds: N/A")

    elif col_type in ("Category", "Text", "Boolean"):
        top_cats = col_data.get("top_categories", [])[:5]
        if top_cats:
            cats_str = ", ".join([f"'{c['value']}' ({c['count']})" for c in top_cats])
            parts.append(f"    Top categories: {cats_str}")
        parts.append(f"    Cardinality: {col_data.get('cardinality', 0)}")

    elif col_type == "Datetime":
        parts.append(f"    Date range: {col_data.get('min_date', 'N/A')} to {col_data.get('max_date', 'N/A')}")
        parts.append(f"    Invalid dates: {col_data.get('invalid_dates', 0)}")

    return "\n".join(parts)


def build_column_context(profile_data: Dict[str, Any], column_name: str) -> str:
    """Builds context focused on a specific column."""
    columns = profile_data.get("columns", {})
    if column_name not in columns:
        return f"Column '{column_name}' not found in profile data."

    col_data = columns[column_name]
    header = build_dataset_context_header(profile_data)
    col_detail = _build_column_context(column_name, col_data)
    return f"{header}\n\nFocused column:\n{col_detail}"


def build_dataset_context_header(profile_data: Dict[str, Any]) -> str:
    """Returns only the global-level context (no per-column breakdown)."""
    return (
        f"Dataset: {profile_data.get('total_rows', 0)} rows × "
        f"{profile_data.get('total_columns', 0)} columns | "
        f"Health score: {profile_data.get('health_score', 0)}/100 | "
        f"Missing: {profile_data.get('total_missing_values', 0)} | "
        f"Duplicates: {profile_data.get('total_duplicate_rows', 0)} | "
        f"Outliers: {profile_data.get('total_outliers', 0)}"
    )


# ─────────────────────────────────────────────────
#  System instruction (shared for all features)
# ─────────────────────────────────────────────────

SYSTEM_INSTRUCTION = """You are Data Detective AI, an expert data quality analyst assistant.
You analyze structured dataset profiling results and provide clear, accurate, actionable insights.

Rules:
- Only make claims supported by the provided profiling data.
- Do not invent business facts or make assumptions about domain not visible in the data.
- Clearly distinguish observations (facts from the data) from recommendations (your suggestions).
- Be concise and specific. Avoid vague generalities.
- You MUST return valid JSON matching the requested schema exactly.
- Do not include markdown code fences in your JSON response — return raw JSON only.
- If a field has no data to support a value, use an empty list [] or empty string "".
"""


# ─────────────────────────────────────────────────
#  Prompt builders for each feature
# ─────────────────────────────────────────────────

def build_summary_prompt(profile_data: Dict[str, Any]) -> str:
    context = build_dataset_context(profile_data)
    return f"""{context}

Based on the above profiling data, generate an executive summary.
Return ONLY valid JSON with this exact structure:
{{
  "overview": "What the dataset appears to represent based on column names and data types",
  "characteristics": ["key characteristic 1", "key characteristic 2", ...],
  "major_issues": ["issue 1", "issue 2", ...],
  "patterns": ["pattern or observation 1", "pattern 2", ...],
  "next_steps": ["recommended next step 1", "next step 2", ...]
}}

Keep each item concise (1-2 sentences). Include 3-5 items per list where appropriate."""


def build_quality_prompt(profile_data: Dict[str, Any]) -> str:
    context = build_dataset_context(profile_data)
    return f"""{context}

Based on the above profiling data, identify specific data quality issues.
Return ONLY valid JSON with this exact structure:
{{
  "insights": [
    {{
      "title": "Short issue title",
      "issue": "Description of the specific issue",
      "why_it_matters": "Why this issue affects analysis quality",
      "recommendation": "Specific actionable recommendation",
      "affected_columns": ["column1", "column2"],
      "confidence": "high|medium|low"
    }}
  ],
  "summary": "Brief overall quality assessment sentence"
}}

Generate insights for: missing values, duplicates, outliers, type issues, date problems, distribution anomalies.
Only include insights where there is actual evidence in the profiling data. If no issues exist for a category, skip it."""


def build_recommendations_prompt(profile_data: Dict[str, Any]) -> str:
    context = build_dataset_context(profile_data)
    return f"""{context}

Based on the above profiling data, generate specific data cleaning recommendations.
Return ONLY valid JSON with this exact structure:
{{
  "recommendations": [
    {{
      "title": "Short recommendation title",
      "description": "Detailed description of what to do and how",
      "priority": "high|medium|low",
      "affected_columns": ["column1", "column2"],
      "reason": "Why this cleaning step is needed based on the data",
      "confidence": "high|medium|low"
    }}
  ],
  "high_priority_count": <number of high priority items>
}}

Cover: missing value imputation, duplicate removal, outlier handling, type corrections, category normalization, date fixes.
Only recommend actions supported by the profiling evidence. Do NOT describe execution steps — provide recommendations only."""


def build_column_prompt(profile_data: Dict[str, Any], column_name: str) -> str:
    context = build_column_context(profile_data, column_name)
    return f"""{context}

Based on the above profiling data for column '{column_name}', provide a detailed explanation.
Return ONLY valid JSON with this exact structure:
{{
  "column_name": "{column_name}",
  "likely_represents": "What this column likely represents based on its name, type and values",
  "data_type": "The detected data type and what it implies for analysis",
  "missing_info": "Analysis of missing values and their potential impact",
  "cardinality_info": "Analysis of uniqueness/cardinality and what it implies",
  "statistics": "Key statistical observations about this column",
  "quality_problems": ["specific problem 1", "specific problem 2"],
  "analysis_ideas": ["useful analysis idea 1", "idea 2", "idea 3"]
}}

Base your entire explanation only on the provided profiling data. Do not hallucinate values or statistics."""


def build_chat_system_prompt(profile_data: Dict[str, Any]) -> str:
    context = build_dataset_context(profile_data)
    return f"""You are Data Detective AI, a helpful data quality assistant.
You have access to detailed profiling data for the user's dataset.
Answer questions accurately based ONLY on the profiling data below.
Be conversational, concise, and helpful.

{context}

When asked about specific columns, refer to the column statistics above.
When you don't have enough data to answer, say so clearly.
Keep responses focused and under 300 words unless detail is specifically requested."""
