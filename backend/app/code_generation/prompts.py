"""
Phase 2C — AI Data Engineering Code Generator prompts and context builders.
Constructs compact schema context for Gemini and enforces structured output rules.
"""
import json
from typing import Dict, Any

SQL_SYSTEM_INSTRUCTION = """You are an expert Data Engineer assistant for Data Detective AI.
Your task is to generate clean, production-ready SQL code based strictly on the dataset's actual schema and profiling statistics.

CRITICAL CONSTRAINTS:
1. ONLY reference columns that actually exist in the provided schema. NEVER invent or hallucinate non-existent columns.
2. NEVER invent non-existent table names. Refer to the dataset table as `dataset`.
3. Generate valid SQL matching the specified SQL dialect (e.g., generic).
4. Do NOT execute any code. Generated code is for preview and download only.
5. Provide a step-by-step explanation matching the generated SQL transformations.
6. If the user requests a column or calculation that is impossible with the schema, state it clearly in the `warnings` array and explain what alternative columns can be used.

Return your response strictly as valid JSON with the following structure:
{
  "language": "sql",
  "dialect": "generic",
  "code": "-- SQL Query\\nSELECT ...",
  "explanation": [
    "Step 1: Filter invalid records",
    "Step 2: Aggregate revenue by category"
  ],
  "used_columns": ["col1", "col2"],
  "warnings": ["Warning if non-existent column was requested"],
  "confidence": "high"
}
"""

PYSPARK_SYSTEM_INSTRUCTION = """You are an expert PySpark Data Engineer assistant for Data Detective AI.
Your task is to generate clean, readable production-style PySpark DataFrame transformation code based strictly on the dataset's actual schema.

CRITICAL CONSTRAINTS:
1. ONLY reference columns that actually exist in the provided schema. NEVER invent or hallucinate non-existent columns.
2. Use modern PySpark DataFrame API (pyspark.sql.functions as F, pyspark.sql.types as T).
3. Clearly define `DATASET_PATH = "s3://your-bucket/path/"` or input path at the top of the generated code.
4. Structure the code logically into Extract, Transform, Validate, and Load steps.
5. Do NOT execute any code. Generated code is for preview and download only.
6. Provide a step-by-step explanation matching the generated PySpark transformations.
7. If the user requests a column or calculation that is impossible with the schema, state it clearly in the `warnings` array.

Return your response strictly as valid JSON with the following structure:
{
  "language": "pyspark",
  "code": "# PySpark DataFrame Pipeline\\nfrom pyspark.sql import SparkSession...",
  "explanation": [
    "Step 1: Initialize SparkSession and load CSV dataset from DATASET_PATH",
    "Step 2: Filter missing customer IDs",
    "Step 3: Save clean dataset as Parquet"
  ],
  "used_columns": ["col1", "col2"],
  "warnings": ["Warning if non-existent column was requested"],
  "confidence": "high",
  "dataset_path_variable": "DATASET_PATH"
}
"""


def build_schema_context(profile_data: Dict[str, Any]) -> str:
    """
    Builds a compact summary of the dataset profile schema for prompt context.
    """
    total_rows = profile_data.get("total_rows", 0)
    total_columns = profile_data.get("total_columns", 0)
    columns = profile_data.get("columns", {})

    col_summaries = []
    for col_name, col_meta in columns.items():
        inferred_type = col_meta.get("inferred_type", "Unknown")
        null_count = col_meta.get("null_count", 0)
        missing_pct = col_meta.get("missing_percentage", 0.0)
        unique_vals = col_meta.get("unique_values", 0)

        details = f"- `{col_name}` ({inferred_type}): {null_count} nulls ({missing_pct:.1f}%), {unique_vals} unique values"
        if "mean" in col_meta and col_meta["mean"] is not None:
            details += f", mean={col_meta['mean']:.2f}, min={col_meta.get('min')}, max={col_meta.get('max')}"
        if "cardinality" in col_meta:
            details += f", cardinality={col_meta['cardinality']}"
        col_summaries.append(details)

    return f"""DATASET SCHEMA CONTEXT:
Total Rows: {total_rows}
Total Columns: {total_columns}
Health Score: {profile_data.get('health_score', 'N/A')}/100

AVAILABLE COLUMNS:
""" + "\n".join(col_summaries)


def build_sql_prompt(profile_data: Dict[str, Any], instruction: str, dialect: str = "generic") -> str:
    """
    Constructs the prompt for SQL code generation.
    """
    schema_context = build_schema_context(profile_data)
    return f"""{schema_context}

TARGET SQL DIALECT: {dialect}

USER INSTRUCTION:
"{instruction}"

Generate valid SQL matching the user's request and the schema context above. Respond ONLY with valid JSON.
"""


def build_pyspark_prompt(profile_data: Dict[str, Any], instruction: str) -> str:
    """
    Constructs the prompt for PySpark code generation.
    """
    schema_context = build_schema_context(profile_data)
    return f"""{schema_context}

USER INSTRUCTION:
"{instruction}"

Generate valid PySpark DataFrame code matching the user's request and the schema context above. Respond ONLY with valid JSON.
"""
