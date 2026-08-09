"""
AIInsight repository — database operations for cached AI insights.
"""
import json
import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.models.ai_insight import AIInsight


class AIInsightRepository:

    @staticmethod
    def get_by_dataset_and_type(
        db: Session,
        dataset_id: str,
        insight_type: str
    ) -> Optional[AIInsight]:
        """
        Retrieves a cached AI insight for a dataset and insight type.
        Returns None if no cached result exists.
        """
        return (
            db.query(AIInsight)
            .filter(
                AIInsight.dataset_id == dataset_id,
                AIInsight.insight_type == insight_type
            )
            .first()
        )

    @staticmethod
    def upsert(
        db: Session,
        dataset_id: str,
        insight_type: str,
        content: dict
    ) -> AIInsight:
        """
        Creates or updates an AI insight cache entry.
        If an entry already exists for (dataset_id, insight_type), it is updated.
        """
        existing = AIInsightRepository.get_by_dataset_and_type(db, dataset_id, insight_type)
        content_json = json.dumps(content)

        if existing:
            existing.content_json = content_json
            existing.updated_at = datetime.datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return existing

        new_insight = AIInsight(
            dataset_id=dataset_id,
            insight_type=insight_type,
            content_json=content_json,
        )
        db.add(new_insight)
        db.commit()
        db.refresh(new_insight)
        return new_insight

    @staticmethod
    def delete_by_dataset(db: Session, dataset_id: str) -> int:
        """
        Deletes all cached AI insights for a dataset.
        Returns the number of deleted rows.
        """
        count = (
            db.query(AIInsight)
            .filter(AIInsight.dataset_id == dataset_id)
            .delete()
        )
        db.commit()
        return count
