"""
AIInsight database model.
Stores cached AI analysis results separately from Phase 2A profiling data.
Never stores API keys or secrets.
"""
import uuid
import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from app.database.base import Base


class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(
        String,
        ForeignKey("datasets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    # Type values: summary | quality | recommendations | column_{colname} | (chat is not cached)
    insight_type = Column(String, nullable=False)

    # Full AI result stored as JSON string
    content_json = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow
    )
