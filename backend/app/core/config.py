import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Force load .env from current directory, parent directory, and project root
load_dotenv(".env")
load_dotenv("../.env")
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"))

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    ENVIRONMENT: str = "development"
    PORT: int = 8000

    # Storage Configuration
    # 'local' → local filesystem | 's3' → Amazon S3
    STORAGE_PROVIDER: str = "local"
    LOCAL_STORAGE_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 50  # Max file size limit in Megabytes

    # Database Settings
    DATABASE_URL: str = "sqlite:///./app.db"

    # ──────────────────────────────────────────────────────────────────────────
    # Phase 2D — AWS Configuration
    # Credentials are resolved via boto3's standard credential chain:
    #   1. AWS_PROFILE (named profile from ~/.aws/credentials)
    #   2. Environment variables (if deployed to CI/CD)
    #   3. IAM role (when deployed to AWS)
    # NEVER put AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY in source code.
    # ──────────────────────────────────────────────────────────────────────────
    AWS_REGION: str = "ap-south-1"
    AWS_PROFILE: Optional[str] = None  # e.g. "data-detective" for local dev

    # S3 Settings
    S3_BUCKET_NAME: Optional[str] = None
    S3_RAW_PREFIX: str = "raw/"
    S3_CURATED_PREFIX: str = "curated/"
    S3_ATHENA_RESULTS_PREFIX: str = "athena-results/"

    # Glue / Athena Settings
    ATHENA_DATABASE: str = "data_detective"
    ATHENA_WORKGROUP: str = "data-detective"
    ATHENA_OUTPUT_LOCATION: Optional[str] = None  # e.g. s3://bucket/athena-results/
    ATHENA_QUERY_TIMEOUT_SECONDS: int = 60

    # AI Settings (Phase 2B / Phase 2C)
    # Uses official google-genai SDK: from google import genai
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.6-flash"
    SQL_DIALECT: str = "generic"

def get_settings() -> Settings:
    return Settings()

settings = get_settings()
