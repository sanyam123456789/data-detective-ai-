"""
AWS Client Factory — Phase 2D
------------------------------
Creates boto3 sessions using the standard credential chain:
  1. AWS_PROFILE named profile (for local dev with data-detective profile)
  2. Environment variables AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY (CI/CD)
  3. IAM role / instance metadata (when deployed to AWS)

NEVER hardcodes credentials. NEVER logs credentials.
"""
import logging
from typing import Optional
import boto3
from botocore.exceptions import NoCredentialsError, ProfileNotFound, BotoCoreError
from app.core.config import settings
from app.core.exceptions import AWSUnavailableException

logger = logging.getLogger("app.data_engineering.aws_client")


def get_boto3_session() -> boto3.Session:
    """
    Returns a boto3 Session using configured profile or standard credential chain.
    Raises AWSUnavailableException if no credentials can be resolved.
    Never logs or exposes credential values.
    """
    try:
        session_kwargs = {"region_name": settings.AWS_REGION}
        if settings.AWS_PROFILE:
            session_kwargs["profile_name"] = settings.AWS_PROFILE
            logger.debug(f"Using AWS profile: {settings.AWS_PROFILE}")
        else:
            logger.debug("Using default boto3 credential chain (no profile specified)")

        session = boto3.Session(**session_kwargs)
        # Validate credentials are resolvable without exposing values
        creds = session.get_credentials()
        if creds is None:
            raise AWSUnavailableException(
                "No AWS credentials found. Set AWS_PROFILE or configure IAM role."
            )
        return session

    except ProfileNotFound as e:
        logger.error(f"AWS profile not found: {settings.AWS_PROFILE!r}")
        raise AWSUnavailableException(
            f"AWS profile '{settings.AWS_PROFILE}' not found in ~/.aws/credentials. "
            "Run 'aws configure --profile data-detective' to set it up."
        )
    except NoCredentialsError:
        logger.error("AWS credentials are not configured.")
        raise AWSUnavailableException(
            "AWS credentials could not be resolved. "
            "Set AWS_PROFILE in your .env or configure an IAM role."
        )
    except BotoCoreError as e:
        logger.error(f"Boto3 session creation failed: {type(e).__name__}")
        raise AWSUnavailableException("AWS client initialization failed. Check region and credential configuration.")


def get_s3_client():
    """Returns a boto3 S3 client."""
    session = get_boto3_session()
    return session.client("s3", region_name=settings.AWS_REGION)


def get_glue_client():
    """Returns a boto3 Glue client."""
    session = get_boto3_session()
    return session.client("glue", region_name=settings.AWS_REGION)


def get_athena_client():
    """Returns a boto3 Athena client."""
    session = get_boto3_session()
    return session.client("athena", region_name=settings.AWS_REGION)


def is_aws_configured() -> bool:
    """
    Returns True if AWS is minimally configured (bucket + credentials resolvable).
    Used to gate pipeline steps gracefully without raising exceptions.
    """
    if not settings.S3_BUCKET_NAME:
        return False
    try:
        get_boto3_session()
        return True
    except AWSUnavailableException:
        return False
