"""
Phase 3 — Quality Engine Schemas
-------------------------------
Pydantic data models for granular Data Quality Audits, Outlier Analysis,
Format Risk Inconsistencies, and Multi-Dimensional Quality Scores.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class OutlierDetail(BaseModel):
    column_name: str
    method: str  # "IQR" or "Z-Score"
    outlier_count: int
    outlier_percentage: float
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None
    sample_outliers: List[Any] = Field(default_factory=list)


class InconsistencyDetail(BaseModel):
    column_name: str
    issue_type: str  # "mixed_types", "whitespace_anomaly", "constant_column", "unparseable_dates"
    description: str
    affected_count: int
    severity: str  # "low", "medium", "high"


class DimensionalScores(BaseModel):
    completeness: float = Field(ge=0.0, le=100.0, description="Ratio of non-null cells")
    validity: float = Field(ge=0.0, le=100.0, description="Ratio of cells passing type/format rules")
    uniqueness: float = Field(ge=0.0, le=100.0, description="Ratio of non-duplicate records")
    consistency: float = Field(ge=0.0, le=100.0, description="Ratio of columns free from type anomalies")
    overall_quality_score: float = Field(ge=0.0, le=100.0)


class QualityAuditResponse(BaseModel):
    dataset_id: str
    total_rows: int
    total_columns: int
    dimensional_scores: DimensionalScores
    outliers_summary: List[OutlierDetail] = Field(default_factory=list)
    inconsistencies_summary: List[InconsistencyDetail] = Field(default_factory=list)
    quality_grade: str  # "EXCELLENT", "GOOD", "NEEDS_ATTENTION", "CRITICAL"
    actionable_checklist: List[str] = Field(default_factory=list)
    audited_at: str
