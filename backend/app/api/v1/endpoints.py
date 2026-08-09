import os
import io
import csv
import uuid
import json
from typing import List, Dict, Any, Optional
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from app.schemas.upload import UploadResponse, HealthStatus, DatasetItem, DatasetProfileSummary
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
)
from app.ai.service import AIService

# Phase 2C — AI Data Engineering Code Generator
from app.code_generation.schemas import (
    CodeGenerationRequest,
    SQLGenerationResponse,
    PySparkGenerationResponse,
)
from app.code_generation.service import CodeGenerationService

router = APIRouter()

@router.get("/ai/diagnostic")
async def ai_diagnostic():
    """
    Diagnostic smoke-test endpoint for Gemini connection.
    Isolates Gemini API call from dataset profiling, database, and schemas.
    Logs full error details safely to backend console.
    """
    import logging
    import traceback
    import importlib.metadata

    logger = logging.getLogger("app.ai.diagnostic")

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
        raise InvalidFileException(f"Failed to generate file preview: {str(e)}")
    return []

@router.get("/health", response_model=HealthStatus)
async def health_check() -> HealthStatus:
    """
    Check the connectivity of downstream databases and cloud storage providers.
    """
    db_connected = False
    try:
        with engine.connect() as conn:
            db_connected = True
    except Exception:
        pass

    return HealthStatus(
        status="healthy",
        environment=settings.ENVIRONMENT,
        storage_provider=settings.STORAGE_PROVIDER,
        s3_bucket_configured=bool(settings.S3_BUCKET_NAME),
        database_connected=db_connected
    )

@router.post("/upload", response_model=UploadResponse)
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)) -> UploadResponse:
    """
    Upload and profile dataset.
    Validates file formats/size limits, generates transient preview, assigns UUID storage key,
    uploads to storage, processes pandas profiling computations, saves metadata, and records profile inside SQLite DB.
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
        raise InvalidFileException(f"Profiling failed: {str(e)}")

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

    # 7. Metadata DB entry
    db_dataset = Dataset(
        original_filename=filename,
        stored_filename=stored_filename,
        storage_type=storage_result["provider"],
        file_size=file_size,
        file_extension=ext,
        mime_type=file.content_type or "application/octet-stream",
        storage_path=storage_result["storage_path"],
        upload_status="COMPLETED"
    )
    
    try:
        saved_dataset = DatasetRepository.create(db, db_dataset)
    except Exception as e:
        raise DatabaseException(f"Metadata write failed: {str(e)}")

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
        raise DatabaseException(f"Profile details write failed: {str(e)}")

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
        total_columns=profile_dict["total_columns"]
    )

@router.get("/datasets", response_model=List[DatasetItem])
async def list_datasets(db: Session = Depends(get_db)) -> List[DatasetItem]:
    """
    List all uploaded dataset records joined with their profile totals.
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
                total_outliers=profile.total_outliers if profile else None
            ))
        return items
    except Exception as e:
        raise DatabaseException(f"Failed to query datasets list: {str(e)}")

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

