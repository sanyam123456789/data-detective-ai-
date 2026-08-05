from sqlalchemy.orm import Session
from app.models.profile import DatasetProfile
from typing import Optional

class DatasetProfileRepository:
    @staticmethod
    def create(db: Session, profile: DatasetProfile) -> DatasetProfile:
        """
        Persists a dataset profiling result to SQLite.
        """
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile

    @staticmethod
    def get_by_dataset_id(db: Session, dataset_id: str) -> Optional[DatasetProfile]:
        """
        Queries the profiling analytics mapped to a specific dataset ID.
        """
        return db.query(DatasetProfile).filter(DatasetProfile.dataset_id == dataset_id).first()
