"""
Phase 3 — Multi-Dimensional Quality Scoring Engine
---------------------------------------------------
Calculates four quality dimensions:
1. Completeness (35%): 100 * (1 - null_cells / total_cells)
2. Validity (25%): 100 * (1 - affected_inconsistencies / total_cells)
3. Uniqueness (20%): 100 * (1 - duplicate_rows / total_rows)
4. Consistency (20%): 100 * (1 - high_severity_anomalies / total_cols)

Weighted Total Quality Score = 0.35*Completeness + 0.25*Validity + 0.20*Uniqueness + 0.20*Consistency
"""

import pandas as pd
from typing import List, Tuple
from app.quality_engine.schemas import DimensionalScores, OutlierDetail, InconsistencyDetail, QualityAuditResponse


def compute_dimensional_scores(
    df: pd.DataFrame,
    outliers: List[OutlierDetail],
    inconsistencies: List[InconsistencyDetail],
) -> Tuple[DimensionalScores, str, List[str]]:
    """Calculates granular quality dimension scores and actionable checklist."""
    total_rows, total_cols = df.shape
    total_cells = total_rows * total_cols if total_rows * total_cols > 0 else 1

    # 1. Completeness Score
    null_cells = int(df.isna().sum().sum())
    completeness = max(0.0, min(100.0, round((1.0 - (null_cells / total_cells)) * 100, 2)))

    # 2. Validity Score
    inconsistent_cells = sum(inc.affected_count for inc in inconsistencies)
    validity = max(0.0, min(100.0, round((1.0 - (inconsistent_cells / total_cells)) * 100, 2)))

    # 3. Uniqueness Score
    duplicate_rows = int(df.duplicated().sum())
    uniqueness = max(0.0, min(100.0, round((1.0 - (duplicate_rows / total_rows)) * 100, 2))) if total_rows > 0 else 100.0

    # 4. Consistency Score
    high_severity_count = sum(1 for inc in inconsistencies if inc.severity == "high")
    consistency = max(0.0, min(100.0, round((1.0 - (high_severity_count / max(1, total_cols))) * 100, 2)))

    # Overall Weighted Score
    overall = round(
        0.35 * completeness +
        0.25 * validity +
        0.20 * uniqueness +
        0.20 * consistency,
        2
    )

    scores = DimensionalScores(
        completeness=completeness,
        validity=validity,
        uniqueness=uniqueness,
        consistency=consistency,
        overall_quality_score=overall,
    )

    # Assign Quality Grade
    if overall >= 90:
        grade = "EXCELLENT"
    elif overall >= 75:
        grade = "GOOD"
    elif overall >= 55:
        grade = "NEEDS_ATTENTION"
    else:
        grade = "CRITICAL"

    # Actionable Checklist
    checklist = []
    if null_cells > 0:
        checklist.append(f"Remediate {null_cells} missing values across table fields.")
    if duplicate_rows > 0:
        checklist.append(f"Deduplicate {duplicate_rows} duplicate record signatures.")
    if len(outliers) > 0:
        total_outlier_cnt = sum(o.outlier_count for o in outliers)
        checklist.append(f"Investigate {total_outlier_cnt} statistical outliers identified across {len(outliers)} numeric columns.")
    if len(inconsistencies) > 0:
        checklist.append(f"Trim and validate {len(inconsistencies)} schema format inconsistency flags.")
    if not checklist:
        checklist.append("Dataset passed all granular quality audit parameters with a clean score.")

    return scores, grade, checklist
