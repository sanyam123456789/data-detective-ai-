from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import router as v1_router
from app.core.config import settings
from app.core.exception_handlers import register_exception_handlers
from app.database.base import Base
from app.database.session import engine
from app.models.dataset import Dataset
from app.models.profile import DatasetProfile
from app.models.ai_insight import AIInsight  # Phase 2B — AI cache table
from mangum import Mangum

# Automatically bootstrap SQLite database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Data Detective AI - Engine API",
    description="Refactored API for Data Detective AI. Implements database persistence and storage layer abstractions.",
    version="1.1.0"
)

# Configure CORS to support frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, restrict to allowed domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Centralized application error handling registration
register_exception_handlers(app)

# Include core v1 API routes under the /api/v1 prefix
app.include_router(v1_router, prefix="/api/v1")

# AWS Lambda Handler mapping
handler = Mangum(app)
