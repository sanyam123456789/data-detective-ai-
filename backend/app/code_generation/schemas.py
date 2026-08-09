"""
Phase 2C — AI Data Engineering Code Generator Pydantic schemas.
All code generation responses conform to these schemas.
"""
from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class CodeGenerationRequest(BaseModel):
    """Request payload for SQL or PySpark code generation."""
    instruction: str = Field(
        description="Natural language instruction for data transformation or query",
        min_length=1,
        max_length=2000
    )


class SQLGenerationResponse(BaseModel):
    """Structured response for generated SQL code."""
    language: str = Field(default="sql", description="Programming language of generated code")
    dialect: str = Field(default="generic", description="SQL dialect (e.g., generic, postgresql, athena)")
    code: str = Field(description="Generated SQL query or transformation script")
    explanation: List[str] = Field(description="Step-by-step breakdown of what the SQL code performs")
    used_columns: List[str] = Field(description="List of dataset columns referenced in the generated SQL")
    warnings: List[str] = Field(default_factory=list, description="Warnings (e.g. requested column missing in schema)")
    confidence: Literal["low", "medium", "high"] = Field(default="high", description="Confidence level of generated code")


class PySparkGenerationResponse(BaseModel):
    """Structured response for generated PySpark code."""
    language: str = Field(default="pyspark", description="Programming language of generated code")
    code: str = Field(description="Generated PySpark code script using PySpark DataFrame API")
    explanation: List[str] = Field(description="Step-by-step breakdown of what the PySpark code performs")
    used_columns: List[str] = Field(description="List of dataset columns referenced in the generated PySpark code")
    warnings: List[str] = Field(default_factory=list, description="Warnings (e.g. requested column missing in schema)")
    confidence: Literal["low", "medium", "high"] = Field(default="high", description="Confidence level of generated code")
    dataset_path_variable: str = Field(default="DATASET_PATH", description="Configurable variable name used for input dataset path")
