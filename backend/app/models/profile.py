import uuid
import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from app.database.base import Base

class DatasetProfile(Base):
    __tablename__ = "dataset_profiles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Global profiling metrics for quick indexing
    total_rows = Column(Integer, nullable=False)
    total_columns = Column(Integer, nullable=False)
    health_score = Column(Integer, nullable=False)
    total_missing_values = Column(Integer, nullable=False)
    total_duplicate_rows = Column(Integer, nullable=False)
    memory_usage_bytes = Column(Integer, nullable=False)
    total_outliers = Column(Integer, nullable=False)
    
    # Complete raw profile data containing JSON structure (stats per type, column specs, outlier boundaries)
    profile_data_json = Column(Text, nullable=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
