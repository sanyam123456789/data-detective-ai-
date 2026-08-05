from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.exceptions import DataDetectiveException

def register_exception_handlers(app: FastAPI) -> None:
    """
    Registers custom global exception handlers to the FastAPI application.
    """
    @app.exception_handler(DataDetectiveException)
    async def data_detective_exception_handler(request: Request, exc: DataDetectiveException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message}
        )
