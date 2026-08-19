"""
Data Normalizer — Phase 2D
---------------------------
Transforms uploaded DataFrames into Athena-compatible curated CSVs.

Rules:
- Column names are sanitized (lowercase, spaces/special chars → underscore)
- Duplicate column names after sanitization get a numeric suffix
- Null values are preserved safely (Athena reads empty string as NULL in CSV)
- Numeric columns are preserved as numeric
- Datetime columns are formatted as ISO 8601 strings (Athena timestamp-compatible)
- No data is silently destroyed — if a value cannot be converted, it's left as-is
"""
import re
import logging
from typing import List, Dict, Any, Tuple
import pandas as pd
import numpy as np

logger = logging.getLogger("app.data_engineering.normalizer")


# Mapping from profiler inferred types → Athena-compatible SQL types
PROFILER_TO_ATHENA_TYPE: Dict[str, str] = {
    "Integer": "bigint",
    "Float": "double",
    "Boolean": "boolean",
    "Datetime": "string",   # stored as ISO string in CSV; cast in Athena if needed
    "Category": "string",
    "Text": "string",
}

# Fallback type for unknown profiler types
DEFAULT_ATHENA_TYPE = "string"


def sanitize_column_name(name: str) -> str:
    """
    Converts a column name to a safe Athena-compatible identifier.
    - Strips leading/trailing whitespace
    - Lowercases
    - Replaces spaces, hyphens, dots, and other special chars with underscore
    - Strips leading digits (Athena identifiers must not start with a digit)
    - Collapses multiple underscores
    """
    name = str(name).strip().lower()
    # Replace common separators with underscore
    name = re.sub(r"[\s\-\.\/\\]+", "_", name)
    # Replace any remaining non-alphanumeric (except underscore) with underscore
    name = re.sub(r"[^\w]", "_", name)
    # Collapse multiple underscores
    name = re.sub(r"_+", "_", name).strip("_")
    # If starts with a digit, prefix with col_
    if name and name[0].isdigit():
        name = "col_" + name
    # If empty after processing, use a fallback
    if not name:
        name = "unnamed"
    return name


def deduplicate_column_names(names: List[str]) -> List[str]:
    """
    Ensures all column names are unique by appending _2, _3, etc. to duplicates.
    """
    seen: Dict[str, int] = {}
    result = []
    for name in names:
        if name not in seen:
            seen[name] = 0
            result.append(name)
        else:
            seen[name] += 1
            result.append(f"{name}_{seen[name] + 1}")
    return result


def infer_athena_type_from_series(series: pd.Series, profiler_type: str) -> str:
    """
    Returns the Athena-compatible column type.
    Uses profiler_type when available; falls back to series dtype inspection.
    """
    if profiler_type in PROFILER_TO_ATHENA_TYPE:
        return PROFILER_TO_ATHENA_TYPE[profiler_type]

    # Fallback: inspect pandas dtype
    if pd.api.types.is_bool_dtype(series):
        return "boolean"
    if pd.api.types.is_integer_dtype(series):
        return "bigint"
    if pd.api.types.is_float_dtype(series):
        return "double"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "string"
    return DEFAULT_ATHENA_TYPE


def normalize_dataframe(
    df: pd.DataFrame,
    detected_types: Dict[str, str],
) -> Tuple[pd.DataFrame, List[Dict[str, Any]]]:
    """
    Normalizes a DataFrame for Athena compatibility.

    Returns:
        (normalized_df, column_schema)
        where column_schema is a list of:
          {"name": str, "athena_type": str, "original_name": str}
    """
    original_columns = [str(c) for c in df.columns]

    # Step 1: Sanitize column names
    sanitized = [sanitize_column_name(c) for c in original_columns]
    sanitized = deduplicate_column_names(sanitized)

    logger.info(f"[Normalizer] Sanitizing {len(original_columns)} columns")

    # Step 2: Rename columns in the DataFrame
    rename_map = dict(zip(df.columns, sanitized))
    df = df.rename(columns=rename_map)

    # Step 3: Build column schema and handle type-specific processing
    column_schema: List[Dict[str, Any]] = []

    for orig_name, new_name in zip(original_columns, sanitized):
        profiler_type = detected_types.get(orig_name, "Text")
        athena_type = infer_athena_type_from_series(df[new_name], profiler_type)

        # Type-specific normalization
        try:
            if profiler_type == "Integer":
                df[new_name] = pd.to_numeric(df[new_name], errors="coerce")
                # Convert float NaN-safe integers back to nullable integer
                df[new_name] = df[new_name].where(df[new_name].notna(), other=None)
            elif profiler_type == "Float":
                df[new_name] = pd.to_numeric(df[new_name], errors="coerce")
            elif profiler_type == "Boolean":
                # Normalize booleans to lowercase true/false for Athena
                bool_map = {
                    "true": "true", "false": "false",
                    "yes": "true", "no": "false",
                    "y": "true", "n": "false",
                    "1": "true", "0": "false",
                    "t": "true", "f": "false",
                }
                df[new_name] = (
                    df[new_name]
                    .astype(str)
                    .str.lower()
                    .str.strip()
                    .map(bool_map)
                    .where(df[new_name].notna(), other=None)
                )
                athena_type = "boolean"
            elif profiler_type == "Datetime":
                # Convert to ISO 8601 string — safest format for Athena
                parsed = pd.to_datetime(df[new_name], errors="coerce")
                df[new_name] = parsed.dt.strftime("%Y-%m-%d %H:%M:%S").where(parsed.notna(), other=None)
                athena_type = "string"
        except Exception as exc:
            logger.warning(f"[Normalizer] Type conversion for column '{new_name}' failed: {exc}. Keeping as-is.")

        column_schema.append({
            "name": new_name,
            "athena_type": athena_type,
            "original_name": orig_name,
        })

    # Step 4: Replace numpy NaN/inf with Python None for clean CSV output
    df = df.replace({np.nan: None, np.inf: None, -np.inf: None})

    logger.info(f"[Normalizer] Normalization complete: {len(df)} rows, {len(sanitized)} columns")
    return df, column_schema
