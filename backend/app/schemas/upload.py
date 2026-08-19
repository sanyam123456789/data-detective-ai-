from pydantic import BaseModel
from typing import Optional, Any, List, Dict

class UploadResponse(BaseModel):
    id: str
    original_filename: str
    stored_filename: str
    storage_type: str
    file_size: int
    file_extension: str
    mime_type: str
    storage_path: str
    upload_status: str
    created_at: str
    preview: List[Dict[str, Any]]
    health_score: int
    total_rows: int
    total_columns: int
    # Phase 2D: pipeline initial status
    pipeline_status: Optional[str] = None

class HealthStatus(BaseModel):
    status: str
    environment: str
    storage_provider: str
    s3_bucket_configured: bool
    database_connected: bool
    # Phase 2D: AWS availability flags
    aws_configured: bool = False
    athena_configured: bool = False

class DatasetItem(BaseModel):
    id: str
    original_filename: str
    stored_filename: str
    storage_type: str
    file_size: int
    file_extension: str
    mime_type: str
    storage_path: str
    upload_status: str
    created_at: Any
    updated_at: Any
    # Enriched stats from SQLite profiling joins
    total_rows: Optional[int] = None
    total_columns: Optional[int] = None
    health_score: Optional[int] = None
    total_missing_values: Optional[int] = None
    total_duplicate_rows: Optional[int] = None
    memory_usage_bytes: Optional[int] = None
    total_outliers: Optional[int] = None
    # Phase 2D: pipeline fields (nullable — local mode omits these)
    pipeline_status: Optional[str] = None
    catalog_table: Optional[str] = None
    catalog_database: Optional[str] = None

class DatasetProfileSummary(BaseModel):
    id: str
    dataset_id: str
    total_rows: int
    total_columns: int
    health_score: int
    total_missing_values: int
    total_duplicate_rows: int
    memory_usage_bytes: int
    total_outliers: int
    profile_data: Dict[str, Any]
    created_at: Any
