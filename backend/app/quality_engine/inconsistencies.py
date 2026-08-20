"""
Phase 3 — Format Risk & Type Inconsistency Module
--------------------------------------------------
Audits columns for:
1. Mixed types (e.g. numeric values mixed with text strings)
2. Whitespace anomalies (leading/trailing spaces in text)
3. Constant columns (zero-variance single value columns)
"""

import pandas as pd
import numpy as np
from typing import List
from app.quality_engine.schemas import InconsistencyDetail


def audit_column_inconsistencies(series: pd.Series, col_name: str) -> List[InconsistencyDetail]:
    """Audits a single Series for format anomalies and mixed data types."""
    details = []
    clean_s = series.dropna()
    total_non_null = len(clean_s)

    if total_non_null == 0:
        return details

    # 1. Constant Column Check
    unique_count = clean_s.nunique()
    if unique_count == 1:
        details.append(InconsistencyDetail(
            column_name=col_name,
            issue_type="constant_column",
            description=f"Column contains only a single constant value across all {total_non_null} non-null rows.",
            affected_count=total_non_null,
            severity="low",
        ))

    # 2. Whitespace Anomaly Check (for string/object columns)
    if series.dtype == object or pd.api.types.is_string_dtype(series):
        str_series = clean_s.astype(str)
        has_whitespace = str_series.apply(lambda x: len(x) != len(x.strip()))
        whitespace_count = int(has_whitespace.sum())

        if whitespace_count > 0:
            details.append(InconsistencyDetail(
                column_name=col_name,
                issue_type="whitespace_anomaly",
                description=f"Found {whitespace_count} rows with un-trimmed leading or trailing spaces.",
                affected_count=whitespace_count,
                severity="medium" if whitespace_count > 5 else "low",
            ))


    # 3. Mixed Types Check (Numeric vs String)
    if series.dtype == object:
        numeric_convertible = pd.to_numeric(clean_s, errors="coerce")
        num_valid = int(numeric_convertible.notna().sum())

        if 0 < num_valid < total_non_null:
            mixed_count = min(num_valid, total_non_null - num_valid)
            details.append(InconsistencyDetail(
                column_name=col_name,
                issue_type="mixed_types",
                description=f"Column contains mixed content: {num_valid} numeric values and {total_non_null - num_valid} text values.",
                affected_count=mixed_count,
                severity="high" if mixed_count > 3 else "medium",
            ))

    return details


def audit_df_inconsistencies(df: pd.DataFrame) -> List[InconsistencyDetail]:
    """Audits all columns in a DataFrame for inconsistencies."""
    inconsistencies = []
    for col in df.columns:
        col_issues = audit_column_inconsistencies(df[col], str(col))
        inconsistencies.extend(col_issues)
    return inconsistencies
