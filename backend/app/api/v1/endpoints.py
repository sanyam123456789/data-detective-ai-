import os
import io
import csv
import uuid
import json
from typing import List, Dict, Any
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.schemas.upload import UploadResponse, HealthStatus, DatasetItem, DatasetProfileSummary
from app.services.storage import get_storage_service, StorageService
from app.core.config import settings
from app.core.exceptions import (
    FileSizeExceededException,
    UnsupportedFormatException,
    InvalidFileException,
    StorageException,
    DatabaseException
)
from app.database.session import get_db, engine
from app.models.dataset import Dataset
from app.models.profile import DatasetProfile
from app.repositories.dataset_repo import DatasetRepository
from app.repositories.profile_repo import DatasetProfileRepository
from app.profiling.profiler import DatasetProfiler

router = APIRouter()

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
