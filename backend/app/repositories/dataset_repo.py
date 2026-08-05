from sqlalchemy.orm import Session
from app.models.dataset import Dataset
from typing import List, Optional

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
