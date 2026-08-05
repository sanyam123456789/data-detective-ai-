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
