"""
Glue Data Catalog Service — Phase 2D
--------------------------------------
Manages AWS Glue database and table metadata programmatically.

Key rules:
- NO Glue crawler is created or invoked (cost control)
- Database creation is idempotent
- Table creation/update is idempotent (safe to call multiple times)
- Table names are generated from dataset_id — never from user filenames
- All operations are gated behind AWS availability check
"""
import re
import logging
from typing import List, Dict, Any
from botocore.exceptions import ClientError
from app.core.config import settings
from app.core.exceptions import GlueException
from app.data_engineering.aws_client import get_glue_client

logger = logging.getLogger("app.data_engineering.catalog_service")


def safe_table_name(dataset_id: str) -> str:
    """
    Generates a safe Glue/Athena table name from a dataset UUID.
    Format: dataset_<first 12 chars of id with hyphens replaced>
    Athena table names: alphanumeric + underscore only.
    """
    short_id = re.sub(r"[^a-z0-9]", "_", dataset_id.lower())[:12]
    return f"dataset_{short_id}"


def ensure_database_exists(database_name: str) -> None:
    """
    Creates the Glue database if it does not already exist.
    Idempotent — safe to call on every pipeline run.
    """
    client = get_glue_client()
    logger.info(f"[Glue] Ensuring database '{database_name}' exists")
    try:
        client.create_database(
            DatabaseInput={
                "Name": database_name,
                "Description": "Data Detective AI — curated datasets catalog",
            }
        )
        logger.info(f"[Glue] Created database '{database_name}'")
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "")
        if error_code == "AlreadyExistsException":
            logger.debug(f"[Glue] Database '{database_name}' already exists — OK")
        elif error_code == "AccessDeniedException":
            raise GlueException("Glue access denied. Check IAM glue:CreateDatabase permission.")
        else:
            logger.error(f"[Glue] create_database failed: {error_code}")
            raise GlueException(f"Glue database creation failed: {error_code}")


def _build_glue_columns(column_schema: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """Converts internal column_schema to Glue API StorageDescriptor columns format."""
    return [
        {"Name": col["name"], "Type": col["athena_type"]}
        for col in column_schema
    ]


def register_table(
    dataset_id: str,
    curated_s3_location: str,
    column_schema: List[Dict[str, Any]],
    database_name: str = None,
) -> str:
    """
    Creates or updates a Glue table pointing to the curated S3 location.
    Returns the table name.

    The table uses CSV SerDe so Athena can read it directly.
    Idempotent — if table exists, it updates the schema and location.
    """
    database_name = database_name or settings.ATHENA_DATABASE
    table_name = safe_table_name(dataset_id)
    client = get_glue_client()

    glue_columns = _build_glue_columns(column_schema)

    table_input = {
        "Name": table_name,
        "Description": f"Curated dataset for dataset_id={dataset_id}",
        "StorageDescriptor": {
            "Columns": glue_columns,
            "Location": curated_s3_location,
            "InputFormat": "org.apache.hadoop.mapred.TextInputFormat",
            "OutputFormat": "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
            "SerdeInfo": {
                "SerializationLibrary": "org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe",
                "Parameters": {
                    "field.delim": ",",
                    "skip.header.line.count": "1",
                    "serialization.format": ",",
                },
            },
            "Compressed": False,
            "NumberOfBuckets": -1,
            "StoredAsSubDirectories": False,
        },
        "TableType": "EXTERNAL_TABLE",
        "Parameters": {
            "classification": "csv",
            "has_encrypted_data": "false",
            "data_detective_dataset_id": dataset_id,
        },
    }

    # Try to create; if already exists, update instead
    try:
        logger.info(f"[Glue] Creating table '{database_name}.{table_name}'")
        client.create_table(
            DatabaseName=database_name,
            TableInput=table_input,
        )
        logger.info(f"[Glue] Table created: '{database_name}.{table_name}'")
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "")
        if error_code == "AlreadyExistsException":
            logger.info(f"[Glue] Table exists — updating: '{database_name}.{table_name}'")
            try:
                client.update_table(
                    DatabaseName=database_name,
                    TableInput=table_input,
                )
                logger.info(f"[Glue] Table updated: '{database_name}.{table_name}'")
            except ClientError as ue:
                update_code = ue.response.get("Error", {}).get("Code", "")
                logger.error(f"[Glue] update_table failed: {update_code}")
                raise GlueException(f"Glue table update failed: {update_code}")
        elif error_code == "AccessDeniedException":
            raise GlueException("Glue access denied. Check IAM glue:CreateTable / glue:UpdateTable permissions.")
        else:
            logger.error(f"[Glue] create_table failed: {error_code}")
            raise GlueException(f"Glue table registration failed: {error_code}")

    return table_name
