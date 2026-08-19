import uuid
import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text
from app.database.base import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False, unique=True)
    storage_type = Column(String, nullable=False)  # "LOCAL" or "S3"
    file_size = Column(Integer, nullable=False)
    file_extension = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    storage_path = Column(String, nullable=False)
    upload_status = Column(String, nullable=False, default="COMPLETED")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # ── Phase 2D: AWS Data Engineering Pipeline fields ─────────────────────────
    # All nullable — local mode continues to work without these populated.
    # Statuses: LOCAL | UPLOADED | PROCESSING | CURATED | CATALOGED | READY | FAILED
    pipeline_status = Column(String, nullable=True, default="LOCAL")
    raw_s3_key = Column(String, nullable=True)       # S3 key for raw uploaded file
    curated_s3_key = Column(String, nullable=True)   # S3 key for normalized curated CSV
    catalog_database = Column(String, nullable=True) # Glue database name
    catalog_table = Column(String, nullable=True)    # Glue/Athena table name
    pipeline_error = Column(Text, nullable=True)     # Last pipeline error message
    processed_at = Column(DateTime, nullable=True)   # When pipeline completed
