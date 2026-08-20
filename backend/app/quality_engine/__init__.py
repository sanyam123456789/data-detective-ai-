"""
Phase 3 — Quality Engine Package
---------------------------------
Decoupled Data Quality & Detective Engine for Data Detective AI.
"""

from app.quality_engine.outliers import analyze_all_outliers
from app.quality_engine.inconsistencies import audit_df_inconsistencies
from app.quality_engine.scorer import compute_dimensional_scores
from app.quality_engine.schemas import QualityAuditResponse

__all__ = [
    "analyze_all_outliers",
    "audit_df_inconsistencies",
    "compute_dimensional_scores",
    "QualityAuditResponse",
]
