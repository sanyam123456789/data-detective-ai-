import uuid
import datetime
from sqlalchemy import Column, String, Integer, DateTime
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
