import datetime
from sqlalchemy.orm import Session
from app.models.dataset import Dataset
from typing import List, Optional, Any

class DatasetRepository:
    @staticmethod
    def create(db: Session, dataset: Dataset) -> Dataset:
        """
        Creates a new dataset record in the database
        """
        db.add(dataset)
        db.commit()
        db.refresh(dataset)
        return dataset

    @staticmethod
    def get_all(db: Session) -> List[Dataset]:
        """
        Retrieves all dataset records sorted by creation timestamp descending
        """
        return db.query(Dataset).order_by(Dataset.created_at.desc()).all()

    @staticmethod
    def get_by_id(db: Session, dataset_id: str) -> Optional[Dataset]:
        """
        Retrieves a dataset record by its unique UUID string
        """
        return db.query(Dataset).filter(Dataset.id == dataset_id).first()

    @staticmethod
    def update_pipeline_fields(db: Session, dataset_id: str, **kwargs: Any) -> Optional[Dataset]:
        """
        Phase 2D — Updates pipeline-related fields on a Dataset record.
        Accepted kwargs: pipeline_status, raw_s3_key, curated_s3_key,
                        catalog_database, catalog_table, pipeline_error, processed_at.
        Always updates updated_at timestamp.
        Returns the updated Dataset or None if not found.
        """
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            return None

        allowed_fields = {
            "pipeline_status", "raw_s3_key", "curated_s3_key",
            "catalog_database", "catalog_table", "pipeline_error", "processed_at",
        }
        for field, value in kwargs.items():
            if field in allowed_fields:
                setattr(dataset, field, value)

        dataset.updated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(dataset)
        return dataset
