"""
Data Engineering Pipeline — Phase 2D
--------------------------------------
Orchestrates the full pipeline:
  Upload → S3 Raw → Normalize → S3 Curated → Glue Catalog → READY

Key behaviors:
- Gracefully degrades when AWS is not configured (pipeline_status = LOCAL)
- Updates Dataset model with pipeline metadata at each step
- Never blocks the upload API response — designed to run in BackgroundTasks
- Each step failure is caught, logged, and recorded as pipeline_error
- Does NOT re-raise exceptions to the caller (background task isolation)
"""
import io
import logging
import datetime
from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List
import pandas as pd
from sqlalchemy.orm import Session
from app.core.config import settings
from app.data_engineering.aws_client import is_aws_configured
from app.data_engineering.s3_service import upload_raw_file, upload_curated_csv, get_curated_s3_uri
from app.data_engineering.normalizer import normalize_dataframe
from app.data_engineering.catalog_service import ensure_database_exists, register_table, safe_table_name
from app.repositories.dataset_repo import DatasetRepository

logger = logging.getLogger("app.data_engineering.pipeline")

# ─── Pipeline Status Constants ────────────────────────────────────────────────
STATUS_LOCAL = "LOCAL"
STATUS_UPLOADED = "UPLOADED"
STATUS_PROCESSING = "PROCESSING"
STATUS_CURATED = "CURATED"
STATUS_CATALOGED = "CATALOGED"
STATUS_READY = "READY"
STATUS_FAILED = "FAILED"


@dataclass
class PipelineResult:
    dataset_id: str
    pipeline_status: str
    raw_s3_key: Optional[str] = None
    curated_s3_key: Optional[str] = None
    catalog_database: Optional[str] = None
    catalog_table: Optional[str] = None
    column_schema: List[Dict[str, Any]] = field(default_factory=list)
    row_count: int = 0
    column_count: int = 0
    pipeline_error: Optional[str] = None
    processed_at: Optional[datetime.datetime] = None


def _load_dataframe(content: bytes, filename: str, ext: str) -> pd.DataFrame:
    """
    Loads bytes content into a pandas DataFrame.
    Excel files are normalized to the first sheet.
    """
    if ext == ".csv":
        try:
            return pd.read_csv(io.BytesIO(content))
        except UnicodeDecodeError:
            return pd.read_csv(io.BytesIO(content), encoding="latin-1")
    elif ext in (".xls", ".xlsx"):
        return pd.read_excel(io.BytesIO(content), sheet_name=0)
    else:
        raise ValueError(f"Unsupported file extension for pipeline: {ext}")


def run_pipeline(
    dataset_id: str,
    content: bytes,
    original_filename: str,
    file_extension: str,
    content_type: str,
    detected_types: Dict[str, str],
    db: Session,
) -> PipelineResult:
    """
    Runs the full AWS data engineering pipeline for a dataset.

    Steps:
    1. Check AWS availability — return LOCAL status if not configured
    2. Upload raw file to S3
    3. Load + normalize DataFrame
    4. Upload curated CSV to S3
    5. Register/update Glue Data Catalog table
    6. Update Dataset model pipeline fields
    7. Return PipelineResult

    This function is safe to call from a BackgroundTask:
    - Catches and logs all exceptions
    - Returns a PipelineResult with status=FAILED on error
    - Updates the database with error details
    """
    result = PipelineResult(dataset_id=dataset_id, pipeline_status=STATUS_LOCAL)

    # ── Step 1: Check AWS availability ────────────────────────────────────────
    if not is_aws_configured():
        logger.info(f"[Pipeline] AWS not configured. Dataset {dataset_id} stored locally only.")
        DatasetRepository.update_pipeline_fields(
            db, dataset_id, pipeline_status=STATUS_LOCAL
        )
        return result

    logger.info(f"[Pipeline] Starting AWS pipeline for dataset_id={dataset_id}")
    DatasetRepository.update_pipeline_fields(
        db, dataset_id, pipeline_status=STATUS_PROCESSING
    )

    try:
        # ── Step 2: Upload raw file ────────────────────────────────────────────
        raw_key = upload_raw_file(
            dataset_id=dataset_id,
            original_filename=original_filename,
            content=content,
            content_type=content_type,
        )
        result.raw_s3_key = raw_key
        DatasetRepository.update_pipeline_fields(
            db, dataset_id,
            pipeline_status=STATUS_UPLOADED,
            raw_s3_key=raw_key,
        )
        logger.info(f"[Pipeline] Raw upload complete: {raw_key}")

        # ── Step 3: Load and normalize ─────────────────────────────────────────
        df = _load_dataframe(content, original_filename, file_extension)
        result.row_count = len(df)
        result.column_count = len(df.columns)

        normalized_df, column_schema = normalize_dataframe(df, detected_types)
        result.column_schema = column_schema

        # ── Step 4: Upload curated CSV ─────────────────────────────────────────
        curated_key = upload_curated_csv(dataset_id=dataset_id, df=normalized_df)
        result.curated_s3_key = curated_key
        DatasetRepository.update_pipeline_fields(
            db, dataset_id,
            pipeline_status=STATUS_CURATED,
            curated_s3_key=curated_key,
        )
        logger.info(f"[Pipeline] Curated CSV uploaded: {curated_key}")

        # ── Step 5: Glue Data Catalog ──────────────────────────────────────────
        database_name = settings.ATHENA_DATABASE
        ensure_database_exists(database_name)

        curated_s3_location = get_curated_s3_uri(curated_key)
        table_name = register_table(
            dataset_id=dataset_id,
            curated_s3_location=curated_s3_location,
            column_schema=column_schema,
            database_name=database_name,
        )
        result.catalog_database = database_name
        result.catalog_table = table_name
        DatasetRepository.update_pipeline_fields(
            db, dataset_id,
            pipeline_status=STATUS_CATALOGED,
            catalog_database=database_name,
            catalog_table=table_name,
        )
        logger.info(f"[Pipeline] Glue table registered: {database_name}.{table_name}")

        # ── Step 6: Mark READY ────────────────────────────────────────────────
        now = datetime.datetime.utcnow()
        result.pipeline_status = STATUS_READY
        result.processed_at = now
        DatasetRepository.update_pipeline_fields(
            db, dataset_id,
            pipeline_status=STATUS_READY,
            processed_at=now,
        )
        logger.info(f"[Pipeline] Pipeline READY for dataset_id={dataset_id}")

    except Exception as exc:
        error_msg = str(exc)
        logger.error(f"[Pipeline] Pipeline FAILED for dataset_id={dataset_id}: {type(exc).__name__}: {error_msg}")
        result.pipeline_status = STATUS_FAILED
        result.pipeline_error = error_msg
        try:
            DatasetRepository.update_pipeline_fields(
                db, dataset_id,
                pipeline_status=STATUS_FAILED,
                pipeline_error=error_msg[:500],  # cap length
            )
        except Exception as db_exc:
            logger.error(f"[Pipeline] Could not update pipeline status in DB: {db_exc}")

    return result
