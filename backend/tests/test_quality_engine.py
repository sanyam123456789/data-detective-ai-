"""
Phase 3 — Quality Engine Unit Tests
------------------------------------
Tests for IQR/Z-score outlier detection, format inconsistencies, and multi-dimensional scoring.
"""

import pandas as pd
import numpy as np
import pytest
from app.quality_engine.outliers import detect_outliers_iqr, detect_outliers_zscore, analyze_all_outliers
from app.quality_engine.inconsistencies import audit_column_inconsistencies, audit_df_inconsistencies
from app.quality_engine.scorer import compute_dimensional_scores


def test_iqr_outliers_detection():
    data = [10, 12, 11, 13, 12, 11, 100]  # 100 is an outlier
    df = pd.DataFrame({"val": data})
    outliers = analyze_all_outliers(df)

    assert len(outliers) == 1
    assert outliers[0].column_name == "val"
    assert outliers[0].outlier_count == 1
    assert 100 in outliers[0].sample_outliers


def test_zscore_outliers_detection():
    s = pd.Series([1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 500])
    res = detect_outliers_zscore(s, "test_col")
    assert res.outlier_count == 1



def test_whitespace_inconsistency():
    df = pd.DataFrame({
        "name": ["Alice ", " Bob", "Charlie"],
        "city": ["Delhi", "Mumbai", "Kolkata"]
    })
    inconsistencies = audit_df_inconsistencies(df)
    whitespace_issues = [inc for inc in inconsistencies if inc.issue_type == "whitespace_anomaly"]
    
    assert len(whitespace_issues) == 1
    assert whitespace_issues[0].column_name == "name"
    assert whitespace_issues[0].affected_count == 2


def test_mixed_type_inconsistency():
    df = pd.DataFrame({
        "mixed_col": [10, 20, 30, "INVALID", 50]
    })
    inconsistencies = audit_df_inconsistencies(df)
    mixed_issues = [inc for inc in inconsistencies if inc.issue_type == "mixed_types"]

    assert len(mixed_issues) == 1
    assert mixed_issues[0].column_name == "mixed_col"


def test_compute_dimensional_scores():
    df = pd.DataFrame({
        "col1": [1, 2, 3, 4, 5],
        "col2": ["A", "B", "C", "D", "E"]
    })
    outliers = analyze_all_outliers(df)
    inconsistencies = audit_df_inconsistencies(df)
    scores, grade, checklist = compute_dimensional_scores(df, outliers, inconsistencies)

    assert scores.completeness == 100.0
    assert scores.validity == 100.0
    assert scores.uniqueness == 100.0
    assert scores.overall_quality_score == 100.0
    assert grade == "EXCELLENT"
