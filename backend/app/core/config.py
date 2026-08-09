import os
from typing import Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Force load .env from current directory, parent directory, and project root
load_dotenv(".env")
load_dotenv("../.env")
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"))

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

    # AI Settings (Phase 2B / Phase 2C)
    # Uses official google-genai SDK: from google import genai
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.6-flash"
    SQL_DIALECT: str = "generic"

    class Config:
        env_file = (".env", "../.env")
        env_file_encoding = "utf-8"
        extra = "ignore"

def get_settings() -> Settings:
    return Settings()

settings = get_settings()
