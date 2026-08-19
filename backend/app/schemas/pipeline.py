"""
Phase 2D — Pipeline and Athena Pydantic schemas.
All schemas follow the existing project conventions.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict


# ─── Pipeline Status ──────────────────────────────────────────────────────────

class PipelineStatusResponse(BaseModel):
    """Response for GET /datasets/{id}/pipeline"""
    dataset_id: str
    pipeline_status: str           # LOCAL | UPLOADED | PROCESSING | CURATED | CATALOGED | READY | FAILED
    storage_provider: str          # LOCAL | S3
    raw_s3_key: Optional[str] = None
    curated_s3_key: Optional[str] = None
    catalog_database: Optional[str] = None
    catalog_table: Optional[str] = None
    pipeline_error: Optional[str] = None
    processed_at: Optional[str] = None
    aws_configured: bool = False
    athena_query_table: Optional[str] = None  # Fully-qualified table for SQL: database.table


class PipelineTriggerResponse(BaseModel):
    """Response for POST /datasets/{id}/pipeline/process"""
    dataset_id: str
    message: str
    pipeline_status: str


# ─── Athena Query ─────────────────────────────────────────────────────────────

class AthenaQueryRequest(BaseModel):
    """Request body for POST /datasets/{id}/query"""
    sql: str = Field(..., min_length=1, max_length=10000, description="Read-only SELECT query")
    max_rows: int = Field(default=100, ge=1, le=1000, description="Maximum rows to return (1-1000)")
    database: Optional[str] = Field(default=None, description="Override Glue database name")


class AthenaQueryResponse(BaseModel):
    """Response for POST /datasets/{id}/query"""
    query_execution_id: str
    status: str
    columns: List[str]
    rows: List[List[Optional[str]]]
    row_count: int
    execution_time_ms: int
    data_scanned_bytes: int
    data_scanned_mb: float  # human-readable


# ─── Extended DatasetItem fields for pipeline ─────────────────────────────────

class DatasetPipelineFields(BaseModel):
    """Mixin-style schema for pipeline fields returned in dataset listings."""
    pipeline_status: Optional[str] = None
    raw_s3_key: Optional[str] = None
    curated_s3_key: Optional[str] = None
    catalog_database: Optional[str] = None
    catalog_table: Optional[str] = None
    processed_at: Optional[Any] = None
