import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    
    # Storage Configuration
    # 's3' or 'local'
    STORAGE_PROVIDER: str = "local"
    LOCAL_STORAGE_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 50  # Max file size limit in Megabytes
    
    # Database Settings
    DATABASE_URL: str = "sqlite:///./app.db"
    
    # AWS Settings
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
