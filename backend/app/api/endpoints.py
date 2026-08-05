import os
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.schemas.upload import UploadResponse, HealthStatus, DatasetItem
from app.services.storage import storage_service
from app.core.config import settings

router = APIRouter()

@router.get("/health", response_model=HealthStatus)
async def health_check() -> HealthStatus:
    """
    Returns API and Storage connectivity status
    """
    return HealthStatus(
        status="healthy",
        environment=settings.ENVIRONMENT,
        storage_provider=settings.STORAGE_PROVIDER,
        s3_bucket_configured=bool(settings.S3_BUCKET_NAME),
        local_storage_dir=settings.LOCAL_STORAGE_DIR if settings.STORAGE_PROVIDER == "local" else None
    )

@router.post("/upload", response_model=UploadResponse)
async def upload_dataset(file: UploadFile = File(...)) -> UploadResponse:
    """
    Validates and uploads a CSV or Excel file to the configured storage provider
    """
    filename = file.filename or "unnamed_file"
    _, ext = os.path.splitext(filename)
    ext = ext.lower()
    
    if ext not in [".csv", ".xlsx", ".xls"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Only CSV and Excel (.xlsx, .xls) are accepted."
        )

    try:
        content = await file.read()
        result = await storage_service.upload_file(
            file_content=content,
            filename=filename,
            content_type=file.content_type or "application/octet-stream"
        )
        
        if not result.get("success", False):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Storage operation failed")
            )
            
        return UploadResponse(
            success=True,
            filename=result["filename"],
            provider=result["provider"],
            url=result.get("url"),
            size=result.get("size")
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )

@router.get("/datasets", response_model=List[DatasetItem])
async def list_datasets() -> List[DatasetItem]:
    """
    Lists metadata of all uploaded datasets in the storage provider
    """
    try:
        return await storage_service.list_files()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list datasets: {str(e)}"
        )
