class DataDetectiveException(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)

class InvalidFileException(DataDetectiveException):
    def __init__(self, message: str = "Invalid file type or structure") -> None:
        super().__init__(message, status_code=400)

class UnsupportedFormatException(DataDetectiveException):
    def __init__(self, message: str = "Unsupported file format. Only CSV, XLS, and XLSX are allowed.") -> None:
        super().__init__(message, status_code=400)

class FileSizeExceededException(DataDetectiveException):
    def __init__(self, message: str = "File size exceeds the allowed limit.") -> None:
        super().__init__(message, status_code=400)

class StorageException(DataDetectiveException):
    def __init__(self, message: str = "Storage upload operation failure.") -> None:
        super().__init__(message, status_code=500)

class DatabaseException(DataDetectiveException):
    def __init__(self, message: str = "Database operation failure.") -> None:
        super().__init__(message, status_code=500)


# ─── Phase 2B: AI Intelligence Layer exceptions ───────────────────────────────

class AIException(DataDetectiveException):
    """General AI processing error. Does not expose API keys or stack traces."""
    def __init__(self, message: str = "AI processing failed. Please try again.") -> None:
        super().__init__(message, status_code=500)

class AIConfigurationException(DataDetectiveException):
    """Raised when the AI client cannot be initialized (missing/invalid API key)."""
    def __init__(self, message: str = "AI is not configured. Check your GEMINI_API_KEY.") -> None:
        super().__init__(message, status_code=500)

class AIUnavailableException(DataDetectiveException):
    """Raised when Gemini API is temporarily unavailable (rate limits, 5xx errors)."""
    def __init__(self, message: str = "AI insights are temporarily unavailable. Your dataset profile is still available.") -> None:
        super().__init__(message, status_code=503)


# ─── Phase 2D: AWS Data Engineering exceptions ────────────────────────────────

class AWSUnavailableException(DataDetectiveException):
    """Raised when AWS credentials are unavailable or misconfigured.
    Never exposes credential details in the message."""
    def __init__(self, message: str = "AWS is not configured or credentials are unavailable. Local mode is active.") -> None:
        super().__init__(message, status_code=503)

class AWSException(DataDetectiveException):
    """General AWS service error. Never exposes credentials or internal ARNs."""
    def __init__(self, message: str = "AWS service error. Please check configuration.") -> None:
        super().__init__(message, status_code=500)

class S3Exception(AWSException):
    """Raised on S3 upload/download failures."""
    def __init__(self, message: str = "S3 storage operation failed.") -> None:
        super().__init__(message)

class GlueException(AWSException):
    """Raised on Glue Data Catalog failures."""
    def __init__(self, message: str = "Glue Data Catalog operation failed.") -> None:
        super().__init__(message)

class AthenaException(AWSException):
    """Raised on Athena query failures."""
    def __init__(self, message: str = "Athena query failed.") -> None:
        super().__init__(message)

class AthenaQueryException(DataDetectiveException):
    """Raised when an Athena query fails due to bad SQL, data limit, or timeout.
    status_code 400 because it's a client-side query problem."""
    def __init__(self, message: str = "Athena query execution failed.") -> None:
        super().__init__(message, status_code=400)

class UnsafeSQLException(DataDetectiveException):
    """Raised when submitted SQL contains destructive or disallowed statements."""
    def __init__(self, message: str = "Unsafe or disallowed SQL statement detected. Only read-only SELECT queries are permitted.") -> None:
        super().__init__(message, status_code=400)
