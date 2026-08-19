"""
Athena Service — Phase 2D
--------------------------
Executes read-only SQL queries via Amazon Athena.

Cost and safety rules:
- ALWAYS uses the configured workgroup (data-detective) which has a 100MB scan limit
- SQL is validated before submission — destructive statements are rejected
- Polling has a configurable timeout (default 60s) — never polls forever
- No retry loops that could re-execute expensive queries
- Query execution IDs are used for traceability (never exposes credentials)
- Friendly error messages for common failure modes (data limit, timeout, bad SQL)
"""
import re
import time
import logging
from typing import Dict, Any, List, Optional
from botocore.exceptions import ClientError
from app.core.config import settings
from app.core.exceptions import AthenaException, AthenaQueryException, UnsafeSQLException
from app.data_engineering.aws_client import get_athena_client

logger = logging.getLogger("app.data_engineering.athena_service")

# ─── SQL Safety ──────────────────────────────────────────────────────────────

# Patterns for disallowed destructive SQL statements
_DISALLOWED_PATTERNS = [
    r"\bDROP\b",
    r"\bDELETE\b",
    r"\bUPDATE\b",
    r"\bINSERT\b",
    r"\bALTER\b",
    r"\bCREATE\s+DATABASE\b",
    r"\bCREATE\s+TABLE\b",
    r"\bCREATE\s+VIEW\b",
    r"\bMSCK\s+REPAIR\b",
    r"\bTRUNCATE\b",
    r"\bGRANT\b",
    r"\bREVOKE\b",
    r"\bLOAD\b",
    r"\bMERGE\b",
]

_DISALLOWED_RE = [re.compile(p, re.IGNORECASE) for p in _DISALLOWED_PATTERNS]


def validate_sql(sql: str) -> None:
    """
    Validates that the SQL is a read-only query.
    Raises UnsafeSQLException if destructive statements are detected.
    Does NOT guarantee full SQL injection protection — this is a safety net,
    not a sandbox. The Athena workgroup enforces the cost limit.
    """
    if not sql or not sql.strip():
        raise UnsafeSQLException("SQL query cannot be empty.")

    if len(sql) > 10_000:
        raise UnsafeSQLException("SQL query exceeds maximum allowed length (10,000 characters).")

    for pattern in _DISALLOWED_RE:
        if pattern.search(sql):
            keyword = pattern.pattern.replace(r"\b", "").replace(r"\s+", " ").strip()
            raise UnsafeSQLException(
                f"Disallowed SQL statement detected: '{keyword}'. "
                "Only read-only SELECT queries are permitted."
            )


# ─── Query Execution ─────────────────────────────────────────────────────────

def _start_query(
    sql: str,
    database: str,
    workgroup: str,
    output_location: str,
) -> str:
    """Submits query to Athena and returns execution_id."""
    client = get_athena_client()
    logger.info(f"[Athena] Starting query on database='{database}', workgroup='{workgroup}'")
    try:
        response = client.start_query_execution(
            QueryString=sql,
            QueryExecutionContext={"Database": database},
            WorkGroup=workgroup,
            ResultConfiguration={"OutputLocation": output_location},
        )
        execution_id = response["QueryExecutionId"]
        logger.info(f"[Athena] Query submitted: execution_id={execution_id}")
        return execution_id
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "")
        error_msg = e.response.get("Error", {}).get("Message", "")
        logger.error(f"[Athena] start_query_execution failed: {error_code}")
        if "data scan limit" in error_msg.lower() or "bytes scanned" in error_msg.lower():
            raise AthenaQueryException(
                "Query rejected: it would exceed the 100 MB data scanned workgroup limit. "
                "Add a WHERE clause or LIMIT to reduce the data scanned."
            )
        if error_code == "AccessDeniedException":
            raise AthenaException("Athena access denied. Check IAM athena:StartQueryExecution permission.")
        raise AthenaException(f"Failed to start Athena query: {error_code}")


def _poll_query(execution_id: str, timeout_seconds: int) -> Dict[str, Any]:
    """
    Polls Athena until query completes, fails, or times out.
    Returns the final QueryExecution dict.
    Never polls forever — respects timeout_seconds.
    """
    client = get_athena_client()
    start_time = time.monotonic()
    poll_interval = 1.0  # seconds between polls

    while True:
        elapsed = time.monotonic() - start_time
        if elapsed > timeout_seconds:
            logger.warning(f"[Athena] Query timeout after {elapsed:.1f}s: execution_id={execution_id}")
            # Do NOT cancel the query (could still be useful in workgroup)
            raise AthenaQueryException(
                f"Query timed out after {timeout_seconds} seconds. "
                "Try a more specific query with a LIMIT clause."
            )

        try:
            response = client.get_query_execution(QueryExecutionId=execution_id)
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "")
            logger.error(f"[Athena] get_query_execution failed: {error_code}")
            raise AthenaException(f"Failed to check query status: {error_code}")

        execution = response["QueryExecution"]
        state = execution["Status"]["State"]

        if state == "SUCCEEDED":
            logger.info(f"[Athena] Query succeeded: execution_id={execution_id}")
            return execution
        elif state in ("FAILED", "CANCELLED"):
            reason = execution["Status"].get("StateChangeReason", "Unknown reason")
            logger.warning(f"[Athena] Query {state}: execution_id={execution_id}, reason={reason}")
            # Sanitize reason to avoid exposing internal paths
            if "data scanned" in reason.lower() or "bytes scanned" in reason.lower():
                raise AthenaQueryException(
                    "Query failed: data scanned limit exceeded (100 MB workgroup limit). "
                    "Reduce scope with WHERE or LIMIT."
                )
            raise AthenaQueryException(f"Athena query {state.lower()}: {reason}")
        else:
            # QUEUED or RUNNING — continue polling
            time.sleep(poll_interval)


def _fetch_results(execution_id: str, max_rows: int = 1000) -> Dict[str, Any]:
    """Fetches query results and returns columns + rows."""
    client = get_athena_client()
    try:
        response = client.get_query_results(
            QueryExecutionId=execution_id,
            MaxResults=min(max_rows + 1, 1001),  # +1 for header row
        )
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "")
        logger.error(f"[Athena] get_query_results failed: {error_code}")
        raise AthenaException(f"Failed to fetch query results: {error_code}")

    result_set = response.get("ResultSet", {})
    rows = result_set.get("Rows", [])
    column_info = result_set.get("ResultSetMetadata", {}).get("ColumnInfo", [])

    columns = [col["Name"] for col in column_info]

    # First row is header — skip it
    data_rows = []
    for row in rows[1:max_rows + 1]:
        data_rows.append([cell.get("VarCharValue", None) for cell in row.get("Data", [])])

    return {"columns": columns, "rows": data_rows}


def run_query(
    sql: str,
    database: Optional[str] = None,
    max_rows: int = 100,
) -> Dict[str, Any]:
    """
    Validates and executes a read-only SQL query on Athena.
    Returns a dict with columns, rows, execution_time_ms, data_scanned_bytes.

    Args:
        sql: The SQL query string (SELECT only)
        database: Glue database name (defaults to settings.ATHENA_DATABASE)
        max_rows: Maximum result rows to return (default 100, max 1000)

    Raises:
        UnsafeSQLException: if SQL contains disallowed statements
        AthenaQueryException: if query fails, times out, or exceeds data limit
        AthenaException: for AWS/infrastructure errors
    """
    # 1. Validate SQL safety
    validate_sql(sql)

    database = database or settings.ATHENA_DATABASE
    workgroup = settings.ATHENA_WORKGROUP
    timeout = settings.ATHENA_QUERY_TIMEOUT_SECONDS

    # Compute output location from settings
    if settings.ATHENA_OUTPUT_LOCATION:
        output_location = settings.ATHENA_OUTPUT_LOCATION
    elif settings.S3_BUCKET_NAME:
        output_location = f"s3://{settings.S3_BUCKET_NAME}/{settings.S3_ATHENA_RESULTS_PREFIX}"
    else:
        raise AthenaException("ATHENA_OUTPUT_LOCATION is not configured.")

    max_rows = max(1, min(max_rows, 1000))

    # 2. Submit query
    execution_id = _start_query(sql, database, workgroup, output_location)

    # 3. Poll to completion
    execution = _poll_query(execution_id, timeout)

    # 4. Extract timing/scan stats
    stats = execution.get("Statistics", {})
    execution_time_ms = stats.get("TotalExecutionTimeInMillis", 0)
    data_scanned_bytes = stats.get("DataScannedInBytes", 0)

    logger.info(
        f"[Athena] Query complete: execution_id={execution_id}, "
        f"time={execution_time_ms}ms, scanned={data_scanned_bytes}B"
    )

    # 5. Fetch results
    results = _fetch_results(execution_id, max_rows)

    return {
        "query_execution_id": execution_id,
        "status": "SUCCEEDED",
        "columns": results["columns"],
        "rows": results["rows"],
        "row_count": len(results["rows"]),
        "execution_time_ms": execution_time_ms,
        "data_scanned_bytes": data_scanned_bytes,
    }
