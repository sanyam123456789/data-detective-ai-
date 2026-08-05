import os
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, Any
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings

class StorageService(ABC):
    """
    Abstract interface for File Storage operations.
    """
    @abstractmethod
    async def upload_file(self, file_content: bytes, filename: str, content_type: str) -> Dict[str, Any]:
        """
        Uploads a file to the storage provider.
        """
        pass

class LocalStorageService(StorageService):
    """
    Local filesystem implementation of StorageService.
    """
    def __init__(self, local_dir: str) -> None:
        self.local_dir = Path(local_dir)
        self.local_dir.mkdir(parents=True, exist_ok=True)

    async def upload_file(self, file_content: bytes, filename: str, content_type: str) -> Dict[str, Any]:
        file_path = self.local_dir / filename
        try:
            with open(file_path, "wb") as f:
                f.write(file_content)
            absolute_path = str(file_path.resolve())
            return {
                "success": True,
                "filename": filename,
                "provider": "LOCAL",
                "storage_path": absolute_path,
                "url": f"file://{absolute_path}",
                "size": len(file_content)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "filename": filename
            }

class S3StorageService(StorageService):
    """
    AWS S3 implementation of StorageService.
    """
    def __init__(self, bucket_name: str, region_name: str, access_key: str = None, secret_key: str = None) -> None:
        s3_kwargs = {"region_name": region_name}
        if access_key and secret_key:
            s3_kwargs["aws_access_key_id"] = access_key
            s3_kwargs["aws_secret_access_key"] = secret_key
        self.s3_client = boto3.client("s3", **s3_kwargs)
        self.bucket_name = bucket_name
        self.region_name = region_name

    async def upload_file(self, file_content: bytes, filename: str, content_type: str) -> Dict[str, Any]:
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=filename,
                Body=file_content,
                ContentType=content_type
            )
            url = f"https://{self.bucket_name}.s3.{self.region_name}.amazonaws.com/{filename}"
            return {
                "success": True,
                "filename": filename,
                "provider": "S3",
                "storage_path": f"s3://{self.bucket_name}/{filename}",
                "url": url,
                "size": len(file_content)
            }
        except ClientError as e:
            return {
                "success": False,
                "error": str(e),
                "filename": filename
            }

def get_storage_service() -> StorageService:
    """
    Factory function returning the configured StorageService concrete instance.
    """
    provider = settings.STORAGE_PROVIDER.lower()
    if provider == "s3":
        if not settings.S3_BUCKET_NAME:
            raise ValueError("S3_BUCKET_NAME is not configured but provider is S3")
        return S3StorageService(
            bucket_name=settings.S3_BUCKET_NAME,
            region_name=settings.AWS_REGION,
            access_key=settings.AWS_ACCESS_KEY_ID,
            secret_key=settings.AWS_SECRET_ACCESS_KEY
        )
    else:
        return LocalStorageService(local_dir=settings.LOCAL_STORAGE_DIR)
