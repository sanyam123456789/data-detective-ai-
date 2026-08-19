"""
S3 Service — Phase 2D
----------------------
Handles raw and curated file storage on Amazon S3.

Key safety rules:
- All object keys are generated programmatically — never from raw user input
- Path traversal is prevented by stripping special chars from filenames
- Bucket name comes from settings, never from frontend/user input
- No credentials are logged or returned to callers
"""
import io
import logging
import re
import datetime
from typing import Dict, Any
import pandas as pd
from botocore.exceptions import ClientError
from app.core.config import settings
from app.core.exceptions import S3Exception
from app.data_engineering.aws_client import get_s3_client

logger = logging.getLogger("app.data_engineering.s3_service")


def _safe_filename_part(name: str) -> str:
    """
    Strips path traversal sequences and unsafe characters from a filename segment.
    Returns only alphanumeric, dash, underscore, and dot characters.
    """
    # Remove path separators and traversal sequences
    name = name.replace("/", "").replace("\\", "").replace("..", "")
    # Keep only safe characters
    name = re.sub(r"[^\w.\-]", "_", name)
    return name[:100]  # cap length


def generate_raw_key(
    dataset_id: str,
    original_filename: str,
    year: int,
    month: int,
) -> str:
    """
    Generates a safe S3 key for the raw uploaded file.
    Format: raw/dataset_id=<id>/year=<YYYY>/month=<MM>/<safe_filename>
    """
    safe_name = _safe_filename_part(original_filename)
    prefix = settings.S3_RAW_PREFIX.rstrip("/")
    return f"{prefix}/dataset_id={dataset_id}/year={year:04d}/month={month:02d}/{safe_name}"


def generate_curated_key(
    dataset_id: str,
    year: int,
    month: int,
) -> str:
    """
    Generates a safe S3 key for the curated CSV.
    Format: curated/dataset_id=<id>/year=<YYYY>/month=<MM>/curated.csv
    """
    prefix = settings.S3_CURATED_PREFIX.rstrip("/")
    return f"{prefix}/dataset_id={dataset_id}/year={year:04d}/month={month:02d}/curated.csv"


def upload_raw_file(
    dataset_id: str,
    original_filename: str,
    content: bytes,
    content_type: str,
) -> str:
    """
    Uploads raw uploaded file to S3 under raw/ prefix.
    Returns the S3 object key on success.
    Raises S3Exception on failure.
    """
    now = datetime.datetime.utcnow()
    key = generate_raw_key(dataset_id, original_filename, now.year, now.month)
    bucket = settings.S3_BUCKET_NAME

    logger.info(f"[S3] Uploading raw file for dataset_id={dataset_id}, key={key!r}")
    try:
        client = get_s3_client()
        client.put_object(
            Bucket=bucket,
            Key=key,
            Body=content,
            ContentType=content_type,
        )
        logger.info(f"[S3] Raw upload complete: s3://{bucket}/{key}")
        return key
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        logger.error(f"[S3] Raw upload failed for dataset_id={dataset_id}, code={error_code}")
        if error_code == "AccessDenied":
            raise S3Exception("S3 access denied. Check IAM permissions for s3:PutObject.")
        raise S3Exception(f"S3 upload failed: {error_code}")


def upload_curated_csv(
    dataset_id: str,
    df: pd.DataFrame,
) -> str:
    """
    Serializes a normalized DataFrame to CSV and uploads to S3 under curated/ prefix.
    Returns the S3 object key on success.
    Raises S3Exception on failure.
    """
    now = datetime.datetime.utcnow()
    key = generate_curated_key(dataset_id, now.year, now.month)
    bucket = settings.S3_BUCKET_NAME

    logger.info(f"[S3] Uploading curated CSV for dataset_id={dataset_id}, key={key!r}")
    try:
        buffer = io.StringIO()
        df.to_csv(buffer, index=False)
        csv_bytes = buffer.getvalue().encode("utf-8")

        client = get_s3_client()
        client.put_object(
            Bucket=bucket,
            Key=key,
            Body=csv_bytes,
            ContentType="text/csv",
        )
        logger.info(f"[S3] Curated CSV upload complete: s3://{bucket}/{key} ({len(csv_bytes)} bytes)")
        return key
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        logger.error(f"[S3] Curated upload failed for dataset_id={dataset_id}, code={error_code}")
        if error_code == "AccessDenied":
            raise S3Exception("S3 access denied uploading curated file. Check IAM permissions.")
        raise S3Exception(f"S3 curated upload failed: {error_code}")


def get_curated_s3_uri(curated_key: str) -> str:
    """Returns the s3:// URI for a curated key (folder prefix for Athena)."""
    bucket = settings.S3_BUCKET_NAME
    # Athena needs the folder prefix, not the file itself
    folder = "/".join(curated_key.split("/")[:-1]) + "/"
    return f"s3://{bucket}/{folder}"
