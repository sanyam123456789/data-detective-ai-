"""
Phase 3 — Outlier & Anomaly Detection Module
---------------------------------------------
Computes statistical outliers using:
1. IQR (Interquartile Range) Method: [Q1 - 1.5*IQR, Q3 + 1.5*IQR]
2. Z-Score Method: |(x - mean) / std| > 3.0
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any
from app.quality_engine.schemas import OutlierDetail


def detect_outliers_iqr(series: pd.Series, col_name: str) -> OutlierDetail:
    """Calculates IQR outliers for a numeric series."""
    clean_s = series.dropna()
    if len(clean_s) < 4:
        return OutlierDetail(
            column_name=col_name,
            method="IQR",
            outlier_count=0,
            outlier_percentage=0.0,
            lower_bound=None,
            upper_bound=None,
            sample_outliers=[],
        )

    q1 = float(clean_s.quantile(0.25))
    q3 = float(clean_s.quantile(0.75))
    iqr = q3 - q1

    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr

    outlier_mask = (clean_s < lower_bound) | (clean_s > upper_bound)
    outliers = clean_s[outlier_mask]

    sample_vals = [float(val) if isinstance(val, (int, float, np.number)) else str(val) for val in outliers.head(5).tolist()]
    total_clean = len(clean_s)
    outlier_pct = round((len(outliers) / total_clean) * 100, 2) if total_clean > 0 else 0.0

    return OutlierDetail(
        column_name=col_name,
        method="IQR",
        outlier_count=len(outliers),
        outlier_percentage=outlier_pct,
        lower_bound=round(lower_bound, 4),
        upper_bound=round(upper_bound, 4),
        sample_outliers=sample_vals,
    )


def detect_outliers_zscore(series: pd.Series, col_name: str, threshold: float = 3.0) -> OutlierDetail:
    """Calculates Z-score outliers for a numeric series."""
    clean_s = series.dropna()
    if len(clean_s) < 4 or clean_s.std() == 0:
        return OutlierDetail(
            column_name=col_name,
            method="Z-Score",
            outlier_count=0,
            outlier_percentage=0.0,
            lower_bound=None,
            upper_bound=None,
            sample_outliers=[],
        )

    mean = float(clean_s.mean())
    std = float(clean_s.std())
    z_scores = (clean_s - mean) / std

    outlier_mask = z_scores.abs() > threshold
    outliers = clean_s[outlier_mask]

    sample_vals = [float(val) if isinstance(val, (int, float, np.number)) else str(val) for val in outliers.head(5).tolist()]
    total_clean = len(clean_s)
    outlier_pct = round((len(outliers) / total_clean) * 100, 2) if total_clean > 0 else 0.0

    return OutlierDetail(
        column_name=col_name,
        method="Z-Score",
        outlier_count=len(outliers),
        outlier_percentage=outlier_pct,
        lower_bound=round(mean - threshold * std, 4),
        upper_bound=round(mean + threshold * std, 4),
        sample_outliers=sample_vals,
    )


def analyze_all_outliers(df: pd.DataFrame) -> List[OutlierDetail]:
    """Analyzes outliers across all numeric columns in a DataFrame."""
    results = []
    numeric_cols = df.select_dtypes(include=[np.number]).columns

    for col in numeric_cols:
        iqr_detail = detect_outliers_iqr(df[col], str(col))
        if iqr_detail.outlier_count > 0:
            results.append(iqr_detail)

    return results
