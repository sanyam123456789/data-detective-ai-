import os
import io
import csv
import uuid
import json
import logging
from typing import List, Dict, Any, Optional
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends, Query, BackgroundTasks
from sqlalchemy.orm import Session
from app.schemas.upload import UploadResponse, HealthStatus, DatasetItem, DatasetProfileSummary
from app.schemas.pipeline import PipelineStatusResponse, PipelineTriggerResponse, AthenaQueryRequest, AthenaQueryResponse
from app.services.storage import get_storage_service, StorageService
from app.core.config import settings
from app.core.exceptions import (
    FileSizeExceededException,
    UnsupportedFormatException,
    InvalidFileException,
    StorageException,
    DatabaseException,
    AIException,
    AIConfigurationException,
    AIUnavailableException,
    AWSUnavailableException,
    AthenaQueryException,
    UnsafeSQLException,
    AthenaException,
)
from app.database.session import get_db, engine
from app.models.dataset import Dataset
from app.models.profile import DatasetProfile
from app.repositories.dataset_repo import DatasetRepository
from app.repositories.profile_repo import DatasetProfileRepository
from app.repositories.ai_insight_repo import AIInsightRepository
from app.profiling.profiler import DatasetProfiler

# Phase 2B — AI Intelligence Layer
from app.ai.schemas import (
    AISummary,
    AIQualityResponse,
    AIRecommendationsResponse,
    AIColumnExplanation,
    AIColumnRequest,
    AIChatRequest,
    AIChatResponse,
    AIAnalystRequest,
    AIAnalystResponse,
)
from app.ai.service import AIService
from app.ai.analyst_service import AIAnalystService


# Phase 2C — AI Data Engineering Code Generator
from app.code_generation.schemas import (
    CodeGenerationRequest,
    SQLGenerationResponse,
    PySparkGenerationResponse,
)
from app.code_generation.service import CodeGenerationService

# Phase 3 — Data Quality & Detective Engine
from app.quality_engine.schemas import QualityAuditResponse

# Phase 2D — AWS Data Engineering Pipeline

from app.data_engineering.aws_client import is_aws_configured
from app.data_engineering.pipeline import run_pipeline, STATUS_LOCAL
from app.data_engineering.catalog_service import safe_table_name

logger = logging.getLogger("app.api.v1.endpoints")

router = APIRouter()

@router.get("/ai/diagnostic")
async def ai_diagnostic():
    """
    Diagnostic smoke-test endpoint for Gemini connection.
    Isolates Gemini API call from dataset profiling, database, and schemas.
    Logs full error details safely to backend console.
    """
    import traceback
    import importlib.metadata

    sdk_version = "Unknown"
    try:
        sdk_version = importlib.metadata.version("google-genai")
    except Exception:
        pass

    from app.core.config import get_settings
    from app.ai.client import get_model_name
    current_settings = get_settings()

    api_key = current_settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY") or ""
    model_name = get_model_name()

    if not api_key.strip():
        logger.error("GEMINI DIAGNOSTIC FAIL: GEMINI_API_KEY is empty or not set.")
        return {
            "status": "failed",
            "error_type": "AIConfigurationException",
            "error_message": "GEMINI_API_KEY is missing in backend .env settings.",
            "sdk_version": sdk_version,
            "model_tested": model_name,
            "api_key_configured": False,
        }

    try:
        from google import genai
    except ImportError as e:
        logger.error(f"GEMINI DIAGNOSTIC FAIL: Import error: {e}")
        return {
            "status": "failed",
            "error_type": "ImportError",
            "error_message": str(e),
            "sdk_version": sdk_version,
            "model_tested": model_name,
            "api_key_configured": True,
        }

    try:
        client = genai.Client(api_key=api_key.strip())
        logger.info(f"GEMINI DIAGNOSTIC: Testing model '{model_name}'...")
        response = client.models.generate_content(
            model=model_name,
            contents="Reply with exactly: Gemini connection successful"
        )
        response_text = response.text.strip() if response and response.text else "No text returned"
        logger.info(f"GEMINI DIAGNOSTIC SUCCESS: {response_text}")
        return {
            "status": "success",
            "response_text": response_text,
            "sdk_version": sdk_version,
            "model_tested": model_name,
            "api_key_configured": True,
        }
    except Exception as e:
        err_type = type(e).__name__
        err_msg = str(e)
        # Sanitize any key if present in error string
        if api_key in err_msg:
            err_msg = err_msg.replace(api_key, "[MASKED_API_KEY]")

        logger.error(f"GEMINI DIAGNOSTIC FAIL [{err_type}]: {err_msg}")
        logger.error(traceback.format_exc())

        return {
            "status": "failed",
            "error_type": err_type,
            "error_message": err_msg,
            "sdk_version": sdk_version,
            "model_tested": model_name,
            "api_key_configured": True,
        }


def generate_preview(content: bytes, ext: str) -> List[Dict[str, Any]]:
    """
    Parses and returns the first 10 rows of a CSV or Excel dataset.
    Does not save or persist any row data.
    """
    try:
        if ext == ".csv":
            try:
                decoded = content.decode("utf-8")
            except UnicodeDecodeError:
                decoded = content.decode("latin-1")
            
            f = io.StringIO(decoded)
            reader = csv.DictReader(f)
            preview = []
            for i, row in enumerate(reader):
                if i >= 10:
                    break
                row_clean = {}
                for k, v in row.items():
                    cleaned_key = str(k) if k is not None else ""
                    cleaned_val = str(v) if v is not None else ""
                    row_clean[cleaned_key] = cleaned_val
                preview.append(row_clean)
            return preview
            
        elif ext in [".xls", ".xlsx"]:
            df = pd.read_excel(io.BytesIO(content), nrows=10)
            df = df.fillna("")
            return df.to_dict(orient="records")
            
    except Exception as e:
        raise InvalidFileException(f"Failed to generate file preview: {str(e)}") from e
    return []

@router.get("/health", response_model=HealthStatus)
async def health_check() -> HealthStatus:
    """
    Check the connectivity of downstream databases and cloud storage providers.
    Phase 2D: also reports AWS and Athena availability.
    """
    db_connected = False
    try:
        with engine.connect() as conn:
            db_connected = True
    except Exception:
        pass

    aws_configured = is_aws_configured()
    athena_configured = aws_configured and bool(
        settings.ATHENA_WORKGROUP and (settings.ATHENA_OUTPUT_LOCATION or settings.S3_BUCKET_NAME)
    )

    return HealthStatus(
        status="healthy",
        environment=settings.ENVIRONMENT,
        storage_provider=settings.STORAGE_PROVIDER,
        s3_bucket_configured=bool(settings.S3_BUCKET_NAME),
        database_connected=db_connected,
        aws_configured=aws_configured,
        athena_configured=athena_configured,
    )

@router.post("/upload", response_model=UploadResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
) -> UploadResponse:
    """
    Upload and profile dataset.
    Validates file formats/size limits, generates transient preview, assigns UUID storage key,
    uploads to storage, processes pandas profiling computations, saves metadata, and records profile inside SQLite DB.
    Phase 2D: triggers AWS data engineering pipeline as a background task when S3 is configured.
    """
    filename = file.filename or "unnamed_file"
    _, ext = os.path.splitext(filename)
    ext = ext.lower()
    
    # 1. Validation (Formats)
    if ext not in [".csv", ".xls", ".xlsx"]:
        raise UnsupportedFormatException(f"Unsupported file format. Only CSV, XLS, and XLSX are allowed.")

    # 2. Size Check
    content = await file.read()
    file_size = len(content)
    max_size_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_size_bytes:
        raise FileSizeExceededException(f"File size exceeds the allowed limit of {settings.MAX_UPLOAD_SIZE_MB}MB.")

    # 3. Preview Generation (Transient)
    preview_data = generate_preview(content, ext)

    # 4. Ingestion Profiler Process
    try:
        profile_dict = DatasetProfiler.profile(content, filename, ext)
    except InvalidFileException as ife:
        raise ife
    except Exception as e:
        raise InvalidFileException(f"Profiling failed: {str(e)}") from e

    # 5. Generate UUID name
    stored_filename = f"{uuid.uuid4().hex[:8]}_{filename}"

    # 6. Storage Upload
    storage_service: StorageService = get_storage_service()
    storage_result = await storage_service.upload_file(
        file_content=content,
        filename=stored_filename,
        content_type=file.content_type or "application/octet-stream"
    )
    
    if not storage_result.get("success", False):
        raise StorageException(f"Failed to save file content to storage: {storage_result.get('error')}")

    # 7. Metadata DB entry — initial pipeline_status = LOCAL
    db_dataset = Dataset(
        original_filename=filename,
        stored_filename=stored_filename,
        storage_type=storage_result["provider"],
        file_size=file_size,
        file_extension=ext,
        mime_type=file.content_type or "application/octet-stream",
        storage_path=storage_result["storage_path"],
        upload_status="COMPLETED",
        pipeline_status=STATUS_LOCAL,
    )
    
    try:
        saved_dataset = DatasetRepository.create(db, db_dataset)
    except Exception as e:
        raise DatabaseException(f"Metadata write failed: {str(e)}") from e

    # 8. Record Profiler stats inside SQLite
    db_profile = DatasetProfile(
        dataset_id=saved_dataset.id,
        total_rows=profile_dict["total_rows"],
        total_columns=profile_dict["total_columns"],
        health_score=profile_dict["health_score"],
        total_missing_values=profile_dict["total_missing_values"],
        total_duplicate_rows=profile_dict["total_duplicate_rows"],
        memory_usage_bytes=profile_dict["memory_usage_bytes"],
        total_outliers=profile_dict["total_outliers"],
        profile_data_json=json.dumps(profile_dict)
    )

    try:
        DatasetProfileRepository.create(db, db_profile)
    except Exception as e:
        raise DatabaseException(f"Profile details write failed: {str(e)}") from e

    # 9. Phase 2D: Trigger AWS pipeline as background task (non-blocking)
    detected_types = profile_dict.get("detected_data_types", {})
    background_tasks.add_task(
        run_pipeline,
        dataset_id=saved_dataset.id,
        content=content,
        original_filename=filename,
        file_extension=ext,
        content_type=file.content_type or "application/octet-stream",
        detected_types=detected_types,
        db=db,
    )

    return UploadResponse(
        id=saved_dataset.id,
        original_filename=saved_dataset.original_filename,
        stored_filename=saved_dataset.stored_filename,
        storage_type=saved_dataset.storage_type,
        file_size=saved_dataset.file_size,
        file_extension=saved_dataset.file_extension,
        mime_type=saved_dataset.mime_type,
        storage_path=saved_dataset.storage_path,
        upload_status=saved_dataset.upload_status,
        created_at=saved_dataset.created_at.isoformat(),
        preview=preview_data,
        health_score=profile_dict["health_score"],
        total_rows=profile_dict["total_rows"],
        total_columns=profile_dict["total_columns"],
        pipeline_status=saved_dataset.pipeline_status,
    )

@router.get("/datasets", response_model=List[DatasetItem])
async def list_datasets(db: Session = Depends(get_db)) -> List[DatasetItem]:
    """
    List all uploaded dataset records joined with their profile totals.
    Phase 2D: includes pipeline_status, catalog_table, catalog_database.
    """
    try:
        datasets = DatasetRepository.get_all(db)
        items = []
        for d in datasets:
            profile = DatasetProfileRepository.get_by_dataset_id(db, d.id)
            items.append(DatasetItem(
                id=d.id,
                original_filename=d.original_filename,
                stored_filename=d.stored_filename,
                storage_type=d.storage_type,
                file_size=d.file_size,
                file_extension=d.file_extension,
                mime_type=d.mime_type,
                storage_path=d.storage_path,
                upload_status=d.upload_status,
                created_at=d.created_at.isoformat() if hasattr(d.created_at, "isoformat") else d.created_at,
                updated_at=d.updated_at.isoformat() if hasattr(d.updated_at, "isoformat") else d.updated_at,
                total_rows=profile.total_rows if profile else None,
                total_columns=profile.total_columns if profile else None,
                health_score=profile.health_score if profile else None,
                total_missing_values=profile.total_missing_values if profile else None,
                total_duplicate_rows=profile.total_duplicate_rows if profile else None,
                memory_usage_bytes=profile.memory_usage_bytes if profile else None,
                total_outliers=profile.total_outliers if profile else None,
                pipeline_status=d.pipeline_status,
                catalog_table=d.catalog_table,
                catalog_database=d.catalog_database,
            ))
        return items
    except Exception as e:
        raise DatabaseException(f"Failed to query datasets list: {str(e)}") from e

@router.get("/datasets/{dataset_id}/profile", response_model=DatasetProfileSummary)
async def get_dataset_profile(dataset_id: str, db: Session = Depends(get_db)) -> DatasetProfileSummary:
    """
    Get detailed profiling data of an uploaded dataset.
    """
    profile = DatasetProfileRepository.get_by_dataset_id(db, dataset_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found for this dataset."
        )
    
    try:
        parsed_data = json.loads(profile.profile_data_json)
    except Exception:
        parsed_data = {}

    return DatasetProfileSummary(
        id=profile.id,
        dataset_id=profile.dataset_id,
        total_rows=profile.total_rows,
        total_columns=profile.total_columns,
        health_score=profile.health_score,
        total_missing_values=profile.total_missing_values,
        total_duplicate_rows=profile.total_duplicate_rows,
        memory_usage_bytes=profile.memory_usage_bytes,
        total_outliers=profile.total_outliers,
        profile_data=parsed_data,
        created_at=profile.created_at.isoformat() if hasattr(profile.created_at, "isoformat") else profile.created_at
    )


@router.get("/datasets/{dataset_id}/quality-audit", response_model=QualityAuditResponse)
async def get_quality_audit(dataset_id: str, db: Session = Depends(get_db)) -> QualityAuditResponse:
    """
    Phase 3 — Get granular Data Quality Audit for a dataset.
    Executes IQR/Z-score outlier detection, format inconsistency audit,
    and multi-dimensional quality scoring. Works seamlessly for local and S3 datasets.
    """
    import datetime
    dataset = DatasetRepository.get_by_id(db, dataset_id)
    profile = DatasetProfileRepository.get_by_dataset_id(db, dataset_id)

    if not dataset and not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Dataset or profile '{dataset_id}' not found.")

    # 1. Try reading local file if dataset record and storage path exist
    df = None
    if dataset:
        possible_paths = [
            dataset.storage_path,
            os.path.join(settings.LOCAL_STORAGE_DIR, dataset.stored_filename),
            os.path.join("./uploads", dataset.stored_filename),
            os.path.join("app/uploads", dataset.stored_filename),
        ]

        for p in possible_paths:
            if p and os.path.exists(p):
                try:
                    if dataset.file_extension == ".csv":
                        df = pd.read_csv(p)
                    else:
                        df = pd.read_excel(p)
                    break
                except Exception:
                    pass


    from app.quality_engine import analyze_all_outliers, audit_df_inconsistencies, compute_dimensional_scores
    from app.quality_engine.schemas import OutlierDetail, InconsistencyDetail, DimensionalScores

    if df is not None:
        outliers = analyze_all_outliers(df)
        inconsistencies = audit_df_inconsistencies(df)
        scores, grade, checklist = compute_dimensional_scores(df, outliers, inconsistencies)

        return QualityAuditResponse(
            dataset_id=dataset_id,
            total_rows=len(df),
            total_columns=len(df.columns),
            dimensional_scores=scores,
            outliers_summary=outliers,
            inconsistencies_summary=inconsistencies,
            quality_grade=grade,
            actionable_checklist=checklist,
            audited_at=datetime.datetime.utcnow().isoformat(),
        )

    # 2. Fallback: Synthesize audit from stored DatasetProfile metadata (for S3 / Lakehouse datasets)
    profile = DatasetProfileRepository.get_by_dataset_id(db, dataset_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found for this dataset.")

    try:
        profile_data = json.loads(profile.profile_data_json)
    except Exception:
        profile_data = {}

    total_rows = profile.total_rows or 0
    total_cols = profile.total_columns or 0
    total_cells = max(1, total_rows * total_cols)

    columns = profile_data.get("columns", {})
    outliers_list: List[OutlierDetail] = []
    inconsistencies_list: List[InconsistencyDetail] = []

    for col_name, col_meta in columns.items():
        # Synthesize outliers if flagged
        outlier_cnt = col_meta.get("outlier_count", 0)
        if outlier_cnt > 0:
            outliers_list.append(OutlierDetail(
                column_name=col_name,
                method="IQR",
                outlier_count=outlier_cnt,
                outlier_percentage=round((outlier_cnt / max(1, total_rows)) * 100, 2),
                lower_bound=col_meta.get("min"),
                upper_bound=col_meta.get("max"),
                sample_outliers=[],
            ))

        # Synthesize missingness inconsistencies
        missing_cnt = col_meta.get("null_count", 0)
        if missing_cnt > 0:
            inconsistencies_list.append(InconsistencyDetail(
                column_name=col_name,
                issue_type="null_cells",
                description=f"Column contains {missing_cnt} missing null values ({col_meta.get('missing_percentage', 0):.1f}% missingness).",
                affected_count=missing_cnt,
                severity="high" if col_meta.get('missing_percentage', 0) > 20 else "medium",
            ))

    completeness = max(0.0, min(100.0, round((1.0 - (profile.total_missing_values / total_cells)) * 100, 2)))
    uniqueness = max(0.0, min(100.0, round((1.0 - (profile.total_duplicate_rows / max(1, total_rows))) * 100, 2)))
    validity = 100.0
    consistency = 100.0
    overall = float(profile.health_score)

    if overall >= 90:
        grade = "EXCELLENT"
    elif overall >= 75:
        grade = "GOOD"
    elif overall >= 55:
        grade = "NEEDS_ATTENTION"
    else:
        grade = "CRITICAL"

    checklist = []
    if profile.total_missing_values > 0:
        checklist.append(f"Remediate {profile.total_missing_values} null values across table schema.")
    if profile.total_duplicate_rows > 0:
        checklist.append(f"Deduplicate {profile.total_duplicate_rows} duplicate record signatures.")
    if profile.total_outliers > 0:
        checklist.append(f"Interrogate {profile.total_outliers} statistical outliers flagged across numeric columns.")
    if not checklist:
        checklist.append("Dataset passed all quality audit parameters with a clean score.")

    return QualityAuditResponse(
        dataset_id=dataset_id,
        total_rows=total_rows,
        total_columns=total_cols,
        dimensional_scores=DimensionalScores(
            completeness=completeness,
            validity=validity,
            uniqueness=uniqueness,
            consistency=consistency,
            overall_quality_score=overall,
        ),
        outliers_summary=outliers_list,
        inconsistencies_summary=inconsistencies_list,
        quality_grade=grade,
        actionable_checklist=checklist,
        audited_at=datetime.datetime.utcnow().isoformat(),
    )



# ══════════════════════════════════════════════════════════════════════════════
#  Phase 2D — AWS Data Engineering Pipeline Endpoints
# ══════════════════════════════════════════════════════════════════════════════


@router.get("/datasets/{dataset_id}/pipeline", response_model=PipelineStatusResponse)
async def get_pipeline_status(dataset_id: str, db: Session = Depends(get_db)) -> PipelineStatusResponse:
    """
    Phase 2D — Get the AWS pipeline status for a dataset.
    Returns S3 keys, Glue catalog info, and Athena table name.
    """
    dataset = DatasetRepository.get_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found.")

    aws_avail = is_aws_configured()
    athena_table = None
    if dataset.catalog_database and dataset.catalog_table:
        athena_table = f'"{dataset.catalog_database}"."{dataset.catalog_table}"'

    return PipelineStatusResponse(
        dataset_id=dataset_id,
        pipeline_status=dataset.pipeline_status or "LOCAL",
        storage_provider=dataset.storage_type,
        raw_s3_key=dataset.raw_s3_key,
        curated_s3_key=dataset.curated_s3_key,
        catalog_database=dataset.catalog_database,
        catalog_table=dataset.catalog_table,
        pipeline_error=dataset.pipeline_error,
        processed_at=dataset.processed_at.isoformat() if dataset.processed_at else None,
        aws_configured=aws_avail,
        athena_query_table=athena_table,
    )


@router.post("/datasets/{dataset_id}/pipeline/process", response_model=PipelineTriggerResponse)
async def trigger_pipeline(
    dataset_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> PipelineTriggerResponse:
    """
    Phase 2D — Manually trigger (or re-trigger) the AWS pipeline for a dataset.
    Retrieves the stored file content and runs the full pipeline in the background.
    """
    dataset = DatasetRepository.get_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found.")

    if not is_aws_configured():
        return PipelineTriggerResponse(
            dataset_id=dataset_id,
            message="AWS is not configured. Local mode is active. Set STORAGE_PROVIDER=s3 and configure S3_BUCKET_NAME.",
            pipeline_status="LOCAL",
        )

    # Load profile for detected_types
    profile = DatasetProfileRepository.get_by_dataset_id(db, dataset_id)
    detected_types: Dict[str, str] = {}
    if profile:
        try:
            profile_data = json.loads(profile.profile_data_json)
            detected_types = profile_data.get("detected_data_types", {})
        except Exception:
            pass

    # Read file content from local storage or S3 for re-processing
    try:
        if dataset.storage_type == "LOCAL" and os.path.exists(dataset.storage_path):
            with open(dataset.storage_path, "rb") as f:
                content = f.read()
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot re-process: original file is no longer accessible locally. "
                       "Upload the file again to trigger the pipeline."
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read stored file: {str(e)}"
        )

    background_tasks.add_task(
        run_pipeline,
        dataset_id=dataset_id,
        content=content,
        original_filename=dataset.original_filename,
        file_extension=dataset.file_extension,
        content_type=dataset.mime_type,
        detected_types=detected_types,
        db=db,
    )

    DatasetRepository.update_pipeline_fields(db, dataset_id, pipeline_status="PROCESSING")

    return PipelineTriggerResponse(
        dataset_id=dataset_id,
        message="Pipeline triggered. Processing in the background — check /pipeline for status updates.",
        pipeline_status="PROCESSING",
    )


@router.post("/datasets/{dataset_id}/query", response_model=AthenaQueryResponse)
async def run_athena_query(
    dataset_id: str,
    request: AthenaQueryRequest,
    db: Session = Depends(get_db),
) -> AthenaQueryResponse:
    """
    Phase 2D — Execute a read-only SQL query against the dataset's Athena table.
    
    - SQL is validated for safety (SELECT only, no destructive statements)
    - Uses the data-detective workgroup with 100MB scan limit
    - Returns up to 1000 rows (default 100)
    - Never exposes AWS credentials to the frontend
    """
    if not is_aws_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Athena is not available: AWS is not configured. Set STORAGE_PROVIDER=s3 and configure S3/Athena settings."
        )

    dataset = DatasetRepository.get_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found.")

    if not dataset.catalog_table:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dataset has no Athena table registered. The pipeline must complete (status=READY) before querying."
        )

    from app.data_engineering.athena_service import run_query, validate_sql
    from app.core.exceptions import UnsafeSQLException, AthenaQueryException, AthenaException

    database = request.database or settings.ATHENA_DATABASE

    try:
        result = run_query(
            sql=request.sql,
            database=database,
            max_rows=request.max_rows,
        )
    except UnsafeSQLException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except AthenaQueryException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except AthenaException as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        logger.error(f"[Query] Unexpected error for dataset_id={dataset_id}: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while executing the query."
        )

    data_scanned_mb = round(result["data_scanned_bytes"] / (1024 * 1024), 4)

    return AthenaQueryResponse(
        query_execution_id=result["query_execution_id"],
        status=result["status"],
        columns=result["columns"],
        rows=result["rows"],
        row_count=result["row_count"],
        execution_time_ms=result["execution_time_ms"],
        data_scanned_bytes=result["data_scanned_bytes"],
        data_scanned_mb=data_scanned_mb,
    )


# ══════════════════════════════════════════════════════════════════════════════
#  Phase 2B — AI Intelligence Layer Endpoints
#  All routes go through FastAPI → Gemini (never Next.js → Gemini directly)
# ══════════════════════════════════════════════════════════════════════════════

def _get_profile_data_or_404(dataset_id: str, db: Session) -> dict:
    """
    Shared helper: loads and parses profile JSON for a dataset.
    Raises HTTP 404 if dataset or profile is not found.
    """
    profile = DatasetProfileRepository.get_by_dataset_id(db, dataset_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found for this dataset. Please ensure the dataset was uploaded and profiled successfully."
        )
    try:
        return json.loads(profile.profile_data_json)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to parse dataset profile data."
        )


@router.post("/datasets/{dataset_id}/ai/summary", response_model=AISummary)
async def ai_summary(
    dataset_id: str,
    force_refresh: bool = Query(default=False, description="Force regeneration even if cached"),
    db: Session = Depends(get_db)
) -> AISummary:
    """
    Feature 1 — AI Executive Summary.
    Generates a natural-language summary of the dataset based on Phase 2A profiling results.
    Results are cached; use ?force_refresh=true to regenerate.
    """
    profile_data = _get_profile_data_or_404(dataset_id, db)

    # Check cache first
    if not force_refresh:
        cached = AIInsightRepository.get_by_dataset_and_type(db, dataset_id, "summary")
        if cached:
            try:
                data = json.loads(cached.content_json)
                return AISummary(**data)
            except Exception:
                pass  # Cache corrupted — fall through to regenerate

    # Generate via Gemini
    result = AIService.generate_summary(profile_data)

    # Cache the result
    try:
        AIInsightRepository.upsert(db, dataset_id, "summary", result.model_dump())
    except Exception:
        pass  # Caching failure must not block the response

    return result


@router.post("/datasets/{dataset_id}/ai/quality", response_model=AIQualityResponse)
async def ai_quality_insights(
    dataset_id: str,
    force_refresh: bool = Query(default=False, description="Force regeneration even if cached"),
    db: Session = Depends(get_db)
) -> AIQualityResponse:
    """
    Feature 2 — Data Quality Insights.
    Identifies and explains data quality issues in the dataset.
    Results are cached; use ?force_refresh=true to regenerate.
    """
    profile_data = _get_profile_data_or_404(dataset_id, db)

    if not force_refresh:
        cached = AIInsightRepository.get_by_dataset_and_type(db, dataset_id, "quality")
        if cached:
            try:
                data = json.loads(cached.content_json)
                return AIQualityResponse(**data)
            except Exception:
                pass

    result = AIService.generate_quality_insights(profile_data)

    try:
        AIInsightRepository.upsert(db, dataset_id, "quality", result.model_dump())
    except Exception:
        pass

    return result


@router.post("/datasets/{dataset_id}/ai/recommendations", response_model=AIRecommendationsResponse)
async def ai_recommendations(
    dataset_id: str,
    force_refresh: bool = Query(default=False, description="Force regeneration even if cached"),
    db: Session = Depends(get_db)
) -> AIRecommendationsResponse:
    """
    Feature 3 — Cleaning Recommendations.
    Provides prioritized data cleaning recommendations based on profiling results.
    Does NOT execute any cleaning operations — recommendations only.
    Results are cached; use ?force_refresh=true to regenerate.
    """
    profile_data = _get_profile_data_or_404(dataset_id, db)

    if not force_refresh:
        cached = AIInsightRepository.get_by_dataset_and_type(db, dataset_id, "recommendations")
        if cached:
            try:
                data = json.loads(cached.content_json)
                return AIRecommendationsResponse(**data)
            except Exception:
                pass

    result = AIService.generate_recommendations(profile_data)

    try:
        AIInsightRepository.upsert(db, dataset_id, "recommendations", result.model_dump())
    except Exception:
        pass

    return result


@router.post("/datasets/{dataset_id}/ai/column", response_model=AIColumnExplanation)
async def ai_column_explain(
    dataset_id: str,
    request: AIColumnRequest,
    force_refresh: bool = Query(default=False, description="Force regeneration even if cached"),
    db: Session = Depends(get_db)
) -> AIColumnExplanation:
    """
    Feature 4 — Column Explainer.
    Provides a detailed AI explanation of a specific column based on profiling statistics.
    Results are cached per column; use ?force_refresh=true to regenerate.
    """
    profile_data = _get_profile_data_or_404(dataset_id, db)

    column_name = request.column_name.strip()
    if not column_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="column_name must not be empty."
        )

    # Validate column exists
    columns = profile_data.get("columns", {})
    if column_name not in columns:
        available = list(columns.keys())[:10]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Column '{column_name}' not found. Available columns: {available}"
        )

    cache_key = f"column_{column_name}"
    if not force_refresh:
        cached = AIInsightRepository.get_by_dataset_and_type(db, dataset_id, cache_key)
        if cached:
            try:
                data = json.loads(cached.content_json)
                return AIColumnExplanation(**data)
            except Exception:
                pass

    result = AIService.explain_column(profile_data, column_name)

    try:
        AIInsightRepository.upsert(db, dataset_id, cache_key, result.model_dump())
    except Exception:
        pass

    return result


@router.post("/datasets/{dataset_id}/ai/chat", response_model=AIChatResponse)
async def ai_chat(
    dataset_id: str,
    request: AIChatRequest,
    db: Session = Depends(get_db)
) -> AIChatResponse:
    """
    Feature 5 — Dataset Chat.
    Allows users to ask questions about the dataset using natural language.
    Chat responses are NOT cached (stateless per request with bounded history context).
    Profile data is loaded from DB; raw CSV is never sent to Gemini.
    """
    profile_data = _get_profile_data_or_404(dataset_id, db)

    message = request.message.strip() if request.message else ""
    if not message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chat message cannot be empty."
        )

    if len(message) > 2000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chat message is too long. Maximum 2000 characters."
        )

    result = AIService.chat(
        profile_data=profile_data,
        message=message,
        history=request.history,
        max_history=request.max_history,
    )

    return result


# ══════════════════════════════════════════════════════════════════════════════
#  Phase 2C — AI Data Engineering Code Generator Endpoints
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/datasets/{dataset_id}/generate/sql", response_model=SQLGenerationResponse)
async def generate_sql(
    dataset_id: str,
    request: CodeGenerationRequest,
    dialect: Optional[str] = Query(default=None, description="Optional SQL dialect (defaults to configured SQL_DIALECT)"),
    db: Session = Depends(get_db)
) -> SQLGenerationResponse:
    """
    Phase 2C — SQL Generator.
    Generates SQL query/transformation code based on dataset schema and natural language instruction.
    Code is generated for preview/download only — NEVER executed on backend.
    """
    profile_data = _get_profile_data_or_404(dataset_id, db)

    instruction = request.instruction.strip() if request.instruction else ""
    if not instruction:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Instruction cannot be empty."
        )

    return CodeGenerationService.generate_sql(
        profile_data=profile_data,
        instruction=instruction,
        dialect=dialect
    )


@router.post("/datasets/{dataset_id}/generate/pyspark", response_model=PySparkGenerationResponse)
async def generate_pyspark(
    dataset_id: str,
    request: CodeGenerationRequest,
    db: Session = Depends(get_db)
) -> PySparkGenerationResponse:
    """
    Phase 2C — PySpark Generator.
    Generates PySpark transformation/ETL pipeline code based on dataset schema and natural language instruction.
    Code is generated for preview/download only — NEVER executed on backend.
    """
    profile_data = _get_profile_data_or_404(dataset_id, db)

    instruction = request.instruction.strip() if request.instruction else ""
    if not instruction:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Instruction cannot be empty."
        )

    return CodeGenerationService.generate_pyspark(
        profile_data=profile_data,
        instruction=instruction
    )


# ══════════════════════════════════════════════════════════════════════════════
#  Phase 4 — Advanced AI Analyst & Root Cause Engine Endpoint
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/datasets/{dataset_id}/ai/analyst", response_model=AIAnalystResponse)
async def ai_analyst_investigate(
    dataset_id: str,
    request: AIAnalystRequest,
    db: Session = Depends(get_db)
) -> AIAnalystResponse:
    """
    Phase 4 — Autonomous AI Data Analyst & Root-Cause Investigation Endpoint.
    Executes: NL Question -> Schema Context -> Athena SQL -> Live Query -> AI Root Cause Analysis.
    """
    profile_data = _get_profile_data_or_404(dataset_id, db)
    dataset = DatasetRepository.get_by_id(db, dataset_id)

    question = request.question.strip() if request.question else ""
    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty."
        )

    database_name = dataset.catalog_database if dataset and dataset.catalog_database else (settings.ATHENA_DATABASE or "data_detective")
    table_name = dataset.catalog_table if dataset and dataset.catalog_table else f"dataset_{dataset_id[:12].replace('-', '_')}"

    return AIAnalystService.investigate(
        question=question,
        table_name=table_name,
        database_name=database_name,
        profile_data=profile_data,
        max_rows=request.max_rows,
    )

