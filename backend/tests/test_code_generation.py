"""
Unit and integration tests for Phase 2C — AI Data Engineering Code Generator.
All Gemini API calls are mocked — no real API key required.
"""
import json
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

SAMPLE_PROFILE_DATA = {
    "total_rows": 1000,
    "total_columns": 5,
    "column_names": ["customer_id", "customer_name", "total_spend", "order_date", "status"],
    "detected_data_types": {
        "customer_id": "Integer",
        "customer_name": "Text",
        "total_spend": "Float",
        "order_date": "Datetime",
        "status": "Category"
    },
    "memory_usage_bytes": 45000,
    "file_size_bytes": 60000,
    "total_duplicate_rows": 0,
    "duplicate_percentage": 0.0,
    "total_missing_values": 10,
    "total_outliers": 5,
    "total_invalid_dates": 0,
    "health_score": 95,
    "health_breakdown": [],
    "columns": {
        "customer_id": {"null_count": 0, "missing_percentage": 0.0, "unique_values": 1000, "duplicate_values": 0, "inferred_type": "Integer"},
        "customer_name": {"null_count": 2, "missing_percentage": 0.2, "unique_values": 998, "duplicate_values": 0, "inferred_type": "Text"},
        "total_spend": {"null_count": 8, "missing_percentage": 0.8, "unique_values": 950, "duplicate_values": 42, "inferred_type": "Float", "mean": 150.5, "min": 5.0, "max": 2500.0},
        "order_date": {"null_count": 0, "missing_percentage": 0.0, "unique_values": 365, "duplicate_values": 635, "inferred_type": "Datetime"},
        "status": {"null_count": 0, "missing_percentage": 0.0, "unique_values": 3, "duplicate_values": 997, "inferred_type": "Category", "cardinality": 3},
    }
}

MOCK_SQL_GEMINI_RESPONSE = json.dumps({
    "language": "sql",
    "dialect": "generic",
    "code": "SELECT customer_id, customer_name, SUM(total_spend) AS total_revenue\nFROM dataset\nGROUP BY customer_id, customer_name\nORDER BY total_revenue DESC\nLIMIT 10;",
    "explanation": [
        "Group records by customer_id and customer_name",
        "Calculate the sum of total_spend for each customer",
        "Sort results in descending order by total revenue",
        "Limit output to the top 10 customers"
    ],
    "used_columns": ["customer_id", "customer_name", "total_spend"],
    "warnings": [],
    "confidence": "high"
})

MOCK_PYSPARK_GEMINI_RESPONSE = json.dumps({
    "language": "pyspark",
    "code": "from pyspark.sql import SparkSession\nimport pyspark.sql.functions as F\n\nDATASET_PATH = 's3://your-bucket/path/'\nspark = SparkSession.builder.appName('DataDetectiveETL').getOrCreate()\n\ndf = spark.read.option('header', 'true').csv(DATASET_PATH)\nclean_df = df.filter(F.col('customer_id').isNotNull())\ntop_df = clean_df.groupBy('customer_id').agg(F.sum('total_spend').alias('total_revenue')).orderBy(F.col('total_revenue').desc()).limit(10)\ntop_df.show()\n",
    "explanation": [
        "Initialize SparkSession and load CSV dataset from DATASET_PATH",
        "Filter out records with null customer_id",
        "Group by customer_id and aggregate sum of total_spend",
        "Order descending and limit to top 10"
    ],
    "used_columns": ["customer_id", "total_spend"],
    "warnings": [],
    "confidence": "high",
    "dataset_path_variable": "DATASET_PATH"
})


# ─── Service Unit Tests ────────────────────────────────────────────────────────

class TestCodeGenerationService:
    """Unit tests for CodeGenerationService logic."""

    def test_generate_sql_success(self):
        """Should generate structured SQL response matching schema."""
        with patch("app.code_generation.service._call_gemini_with_retry", return_value=MOCK_SQL_GEMINI_RESPONSE):
            from app.code_generation.service import CodeGenerationService
            res = CodeGenerationService.generate_sql(SAMPLE_PROFILE_DATA, "Find top 10 customers by total spend")
            assert res.language == "sql"
            assert "SELECT" in res.code
            assert len(res.explanation) == 4
            assert "customer_id" in res.used_columns
            assert res.confidence == "high"

    def test_generate_pyspark_success(self):
        """Should generate structured PySpark response matching schema."""
        with patch("app.code_generation.service._call_gemini_with_retry", return_value=MOCK_PYSPARK_GEMINI_RESPONSE):
            from app.code_generation.service import CodeGenerationService
            res = CodeGenerationService.generate_pyspark(SAMPLE_PROFILE_DATA, "Create PySpark pipeline for top customers")
            assert res.language == "pyspark"
            assert "SparkSession" in res.code
            assert "DATASET_PATH" in res.code
            assert len(res.explanation) == 4
            assert res.dataset_path_variable == "DATASET_PATH"


# ─── Validator Unit Tests ──────────────────────────────────────────────────────

class TestCodeValidators:
    """Unit tests for safety, syntax, and column validators."""

    def test_column_availability_warning_for_missing_column(self):
        """Should detect missing column requests (e.g. 'profit') and produce warning."""
        from app.code_generation.validators import validate_column_availability
        matched, warnings = validate_column_availability("Calculate average profit for customers", SAMPLE_PROFILE_DATA)
        assert any("profit" in w for w in warnings)

    def test_code_safety_validator_accepts_safe_code(self):
        """Should accept standard PySpark and SQL code."""
        from app.code_generation.validators import validate_code_safety
        safe_py = "df = spark.read.csv('data.csv')\nclean_df = df.filter(df['spend'] > 0)"
        is_safe, err = validate_code_safety(safe_py)
        assert is_safe is True
        assert err is None

    def test_code_safety_validator_rejects_eval(self):
        """Should reject code containing eval()."""
        from app.code_generation.validators import validate_code_safety
        unsafe_code = "eval('__import__(\"os\").system(\"dir\")')"
        is_safe, err = validate_code_safety(unsafe_code)
        assert is_safe is False
        assert "eval" in err.lower()

    def test_code_safety_validator_rejects_subprocess(self):
        """Should reject code containing subprocess."""
        from app.code_generation.validators import validate_code_safety
        unsafe_code = "import subprocess\nsubprocess.run(['ls'])"
        is_safe, err = validate_code_safety(unsafe_code)
        assert is_safe is False
        assert "subprocess" in err.lower()

    def test_pyspark_ast_syntax_validator_valid(self):
        """Should validate correct Python AST syntax."""
        from app.code_generation.validators import validate_pyspark_code
        valid_code = "x = 10\ny = x * 2\nprint(y)"
        is_valid, msg = validate_pyspark_code(valid_code)
        assert is_valid is True

    def test_pyspark_ast_syntax_validator_invalid(self):
        """Should detect Python syntax error in invalid code."""
        from app.code_generation.validators import validate_pyspark_code
        invalid_code = "def foo(:\n  return 42"
        is_valid, msg = validate_pyspark_code(invalid_code)
        assert is_valid is False
        assert "syntax error" in msg.lower()


# ─── Endpoint Integration Tests ───────────────────────────────────────────────

class TestCodeGenerationEndpoints:
    """Integration tests for Phase 2C API endpoints."""

    def test_sql_endpoint_404_when_profile_missing(self):
        """POST /generate/sql returns 404 if profile does not exist."""
        from app.main import app
        client = TestClient(app)

        with patch("app.repositories.profile_repo.DatasetProfileRepository.get_by_dataset_id", return_value=None):
            response = client.post(
                "/api/v1/datasets/nonexistent-id/generate/sql",
                json={"instruction": "Find top customers"}
            )
            assert response.status_code == 404

    def test_pyspark_endpoint_404_when_profile_missing(self):
        """POST /generate/pyspark returns 404 if profile does not exist."""
        from app.main import app
        client = TestClient(app)

        with patch("app.repositories.profile_repo.DatasetProfileRepository.get_by_dataset_id", return_value=None):
            response = client.post(
                "/api/v1/datasets/nonexistent-id/generate/pyspark",
                json={"instruction": "Create PySpark pipeline"}
            )
            assert response.status_code == 404

    def test_sql_endpoint_empty_instruction_returns_400(self):
        """POST /generate/sql returns 400 when instruction is empty."""
        from app.main import app
        client = TestClient(app)

        mock_profile = MagicMock()
        mock_profile.profile_data_json = json.dumps(SAMPLE_PROFILE_DATA)

        with patch("app.repositories.profile_repo.DatasetProfileRepository.get_by_dataset_id", return_value=mock_profile):
            response = client.post(
                "/api/v1/datasets/test-id/generate/sql",
                json={"instruction": "   "}
            )
            assert response.status_code in (400, 422)

    def test_ai_unavailable_returns_503(self):
        """Gemini unavailability should return 503 with friendly message."""
        from app.main import app
        from app.core.exceptions import AIUnavailableException
        client = TestClient(app)

        mock_profile = MagicMock()
        mock_profile.profile_data_json = json.dumps(SAMPLE_PROFILE_DATA)

        with patch("app.repositories.profile_repo.DatasetProfileRepository.get_by_dataset_id", return_value=mock_profile), \
             patch("app.code_generation.service.CodeGenerationService.generate_sql", side_effect=AIUnavailableException()):
            response = client.post(
                "/api/v1/datasets/test-id/generate/sql",
                json={"instruction": "Top 10 customers"}
            )
            assert response.status_code == 503
            data = response.json()
            assert "detail" in data
