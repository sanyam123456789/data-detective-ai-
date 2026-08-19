"""
Phase 2D — Data Engineering Unit Tests
----------------------------------------
All tests are mockable — no real AWS credentials required.
AWS integration tests are clearly separated and marked with @pytest.mark.integration.

Test coverage:
1. S3 key generation (raw and curated)
2. Column name sanitization
3. DataFrame normalization + type mapping
4. SQL validation (safe/unsafe)
5. safe_table_name generation
6. Pipeline status transitions
7. AWS unavailable graceful degradation
8. AWS configuration loading
"""
import os
import pytest
import pandas as pd
from unittest.mock import MagicMock, patch

# ─── Ensure test environment is set before imports ────────────────────────────
os.environ.setdefault("STORAGE_PROVIDER", "local")
os.environ.setdefault("S3_BUCKET_NAME", "test-bucket")
os.environ.setdefault("AWS_REGION", "ap-south-1")
os.environ.setdefault("ATHENA_DATABASE", "data_detective")
os.environ.setdefault("ATHENA_WORKGROUP", "data-detective")


# ══════════════════════════════════════════════════════════════════════════════
#  1. S3 Key Generation
# ══════════════════════════════════════════════════════════════════════════════

class TestS3KeyGeneration:
    def test_raw_key_structure(self):
        from app.data_engineering.s3_service import generate_raw_key
        key = generate_raw_key("abc-123", "sales_data.csv", 2026, 8)
        assert key.startswith("raw/")
        assert "dataset_id=abc-123" in key
        assert "year=2026" in key
        assert "month=08" in key
        assert "sales_data.csv" in key

    def test_curated_key_structure(self):
        from app.data_engineering.s3_service import generate_curated_key
        key = generate_curated_key("abc-123", 2026, 8)
        assert key.startswith("curated/")
        assert "dataset_id=abc-123" in key
        assert "year=2026" in key
        assert "month=08" in key
        assert key.endswith("curated.csv")

    def test_raw_key_path_traversal_prevention(self):
        """Path traversal sequences must be stripped from filenames."""
        from app.data_engineering.s3_service import generate_raw_key
        key = generate_raw_key("abc-123", "../../etc/passwd", 2026, 8)
        assert ".." not in key
        assert "etc" in key or "passwd" in key  # content preserved, traversal removed

    def test_raw_key_special_chars_sanitized(self):
        from app.data_engineering.s3_service import generate_raw_key
        key = generate_raw_key("abc-123", "file with spaces & chars!.csv", 2026, 8)
        # Key should not have raw spaces or ampersands
        assert " " not in key or key.count(" ") == 0

    def test_curated_s3_uri(self):
        from app.data_engineering.s3_service import get_curated_s3_uri
        with patch("app.data_engineering.s3_service.settings") as mock_settings:
            mock_settings.S3_BUCKET_NAME = "my-bucket"
            uri = get_curated_s3_uri("curated/dataset_id=abc/year=2026/month=08/curated.csv")
        assert uri.startswith("s3://my-bucket/curated/")
        assert uri.endswith("/")


# ══════════════════════════════════════════════════════════════════════════════
#  2. Column Name Sanitization
# ══════════════════════════════════════════════════════════════════════════════

class TestColumnSanitization:
    def test_lowercase(self):
        from app.data_engineering.normalizer import sanitize_column_name
        assert sanitize_column_name("TOTAL_REVENUE") == "total_revenue"

    def test_spaces_to_underscore(self):
        from app.data_engineering.normalizer import sanitize_column_name
        assert sanitize_column_name("First Name") == "first_name"

    def test_hyphens_to_underscore(self):
        from app.data_engineering.normalizer import sanitize_column_name
        assert sanitize_column_name("order-date") == "order_date"

    def test_special_chars_removed(self):
        from app.data_engineering.normalizer import sanitize_column_name
        result = sanitize_column_name("Revenue ($)")
        assert "$" not in result
        assert "(" not in result

    def test_leading_digit_prefixed(self):
        from app.data_engineering.normalizer import sanitize_column_name
        result = sanitize_column_name("1st_value")
        assert result.startswith("col_") or not result[0].isdigit()

    def test_empty_string_fallback(self):
        from app.data_engineering.normalizer import sanitize_column_name
        result = sanitize_column_name("")
        assert result == "unnamed"

    def test_dots_to_underscore(self):
        from app.data_engineering.normalizer import sanitize_column_name
        result = sanitize_column_name("user.email")
        assert result == "user_email"

    def test_multiple_underscores_collapsed(self):
        from app.data_engineering.normalizer import sanitize_column_name
        result = sanitize_column_name("col  name  here")
        assert "__" not in result

    def test_deduplicate_names(self):
        from app.data_engineering.normalizer import deduplicate_column_names
        result = deduplicate_column_names(["name", "name", "name"])
        assert result[0] == "name"
        assert result[1] != result[0]
        assert result[2] != result[0]
        assert len(set(result)) == 3


# ══════════════════════════════════════════════════════════════════════════════
#  3. DataFrame Normalization
# ══════════════════════════════════════════════════════════════════════════════

class TestDataFrameNormalization:
    def _make_df(self):
        return pd.DataFrame({
            "First Name": ["Alice", "Bob", None],
            "Revenue ($)": [100.5, 200.0, None],
            "Active": ["true", "false", "yes"],
            "Order Date": ["2024-01-01", "2024-06-15", None],
        })

    def test_column_names_sanitized(self):
        from app.data_engineering.normalizer import normalize_dataframe
        df = self._make_df()
        detected = {"First Name": "Text", "Revenue ($)": "Float", "Active": "Boolean", "Order Date": "Datetime"}
        norm_df, schema = normalize_dataframe(df, detected)
        col_names = [c["name"] for c in schema]
        assert "first_name" in col_names
        assert "revenue_" in col_names[1] or "revenue" in col_names[1]

    def test_schema_has_athena_types(self):
        from app.data_engineering.normalizer import normalize_dataframe
        df = pd.DataFrame({"score": [1, 2, 3], "label": ["a", "b", "c"]})
        detected = {"score": "Integer", "label": "Category"}
        _, schema = normalize_dataframe(df, detected)
        type_map = {c["name"]: c["athena_type"] for c in schema}
        assert type_map.get("score") == "bigint"
        assert type_map.get("label") == "string"

    def test_original_name_preserved_in_schema(self):
        from app.data_engineering.normalizer import normalize_dataframe
        df = pd.DataFrame({"First Name": ["Alice"]})
        detected = {"First Name": "Text"}
        _, schema = normalize_dataframe(df, detected)
        assert schema[0]["original_name"] == "First Name"

    def test_row_count_preserved(self):
        from app.data_engineering.normalizer import normalize_dataframe
        df = pd.DataFrame({"a": [1, 2, 3, 4, 5]})
        detected = {"a": "Integer"}
        norm_df, _ = normalize_dataframe(df, detected)
        assert len(norm_df) == 5


# ══════════════════════════════════════════════════════════════════════════════
#  4. Athena Type Mapping
# ══════════════════════════════════════════════════════════════════════════════

class TestAthenaTypeMapping:
    def test_integer_maps_to_bigint(self):
        from app.data_engineering.normalizer import PROFILER_TO_ATHENA_TYPE
        assert PROFILER_TO_ATHENA_TYPE["Integer"] == "bigint"

    def test_float_maps_to_double(self):
        from app.data_engineering.normalizer import PROFILER_TO_ATHENA_TYPE
        assert PROFILER_TO_ATHENA_TYPE["Float"] == "double"

    def test_boolean_maps_to_boolean(self):
        from app.data_engineering.normalizer import PROFILER_TO_ATHENA_TYPE
        assert PROFILER_TO_ATHENA_TYPE["Boolean"] == "boolean"

    def test_category_maps_to_string(self):
        from app.data_engineering.normalizer import PROFILER_TO_ATHENA_TYPE
        assert PROFILER_TO_ATHENA_TYPE["Category"] == "string"

    def test_text_maps_to_string(self):
        from app.data_engineering.normalizer import PROFILER_TO_ATHENA_TYPE
        assert PROFILER_TO_ATHENA_TYPE["Text"] == "string"


# ══════════════════════════════════════════════════════════════════════════════
#  5. SQL Validation
# ══════════════════════════════════════════════════════════════════════════════

class TestSQLValidation:
    def test_select_allowed(self):
        from app.data_engineering.athena_service import validate_sql
        # Should not raise
        validate_sql("SELECT * FROM dataset_abc LIMIT 10")

    def test_select_with_where_allowed(self):
        from app.data_engineering.athena_service import validate_sql
        validate_sql("SELECT name, revenue FROM dataset_abc WHERE revenue > 100 LIMIT 50")

    def test_with_cte_allowed(self):
        from app.data_engineering.athena_service import validate_sql
        validate_sql("WITH cte AS (SELECT * FROM t) SELECT * FROM cte LIMIT 10")

    def test_drop_rejected(self):
        from app.data_engineering.athena_service import validate_sql
        from app.core.exceptions import UnsafeSQLException
        with pytest.raises(UnsafeSQLException):
            validate_sql("DROP TABLE dataset_abc")

    def test_delete_rejected(self):
        from app.data_engineering.athena_service import validate_sql
        from app.core.exceptions import UnsafeSQLException
        with pytest.raises(UnsafeSQLException):
            validate_sql("DELETE FROM dataset_abc WHERE id = 1")

    def test_insert_rejected(self):
        from app.data_engineering.athena_service import validate_sql
        from app.core.exceptions import UnsafeSQLException
        with pytest.raises(UnsafeSQLException):
            validate_sql("INSERT INTO dataset_abc VALUES (1, 'test')")

    def test_update_rejected(self):
        from app.data_engineering.athena_service import validate_sql
        from app.core.exceptions import UnsafeSQLException
        with pytest.raises(UnsafeSQLException):
            validate_sql("UPDATE dataset_abc SET name = 'x'")

    def test_create_table_rejected(self):
        from app.data_engineering.athena_service import validate_sql
        from app.core.exceptions import UnsafeSQLException
        with pytest.raises(UnsafeSQLException):
            validate_sql("CREATE TABLE new_table (id INT)")

    def test_alter_rejected(self):
        from app.data_engineering.athena_service import validate_sql
        from app.core.exceptions import UnsafeSQLException
        with pytest.raises(UnsafeSQLException):
            validate_sql("ALTER TABLE dataset_abc ADD COLUMN x INT")

    def test_msck_repair_rejected(self):
        from app.data_engineering.athena_service import validate_sql
        from app.core.exceptions import UnsafeSQLException
        with pytest.raises(UnsafeSQLException):
            validate_sql("MSCK REPAIR TABLE dataset_abc")

    def test_empty_sql_rejected(self):
        from app.data_engineering.athena_service import validate_sql
        from app.core.exceptions import UnsafeSQLException
        with pytest.raises(UnsafeSQLException):
            validate_sql("")

    def test_too_long_sql_rejected(self):
        from app.data_engineering.athena_service import validate_sql
        from app.core.exceptions import UnsafeSQLException
        with pytest.raises(UnsafeSQLException):
            validate_sql("SELECT " + "x" * 10001)

    def test_case_insensitive_drop(self):
        from app.data_engineering.athena_service import validate_sql
        from app.core.exceptions import UnsafeSQLException
        with pytest.raises(UnsafeSQLException):
            validate_sql("drop table dataset_abc")


# ══════════════════════════════════════════════════════════════════════════════
#  6. Safe Table Name Generation
# ══════════════════════════════════════════════════════════════════════════════

class TestSafeTableName:
    def test_format(self):
        from app.data_engineering.catalog_service import safe_table_name
        name = safe_table_name("abc12345-6789-abcd-ef01-234567890abc")
        assert name.startswith("dataset_")
        assert len(name) <= 20

    def test_no_hyphens(self):
        from app.data_engineering.catalog_service import safe_table_name
        name = safe_table_name("abc-123-def-456")
        assert "-" not in name

    def test_lowercase(self):
        from app.data_engineering.catalog_service import safe_table_name
        name = safe_table_name("UPPERCASE-ID")
        assert name == name.lower()

    def test_different_ids_produce_different_names(self):
        from app.data_engineering.catalog_service import safe_table_name
        name1 = safe_table_name("aaaaaa-1111-1111-1111-111111111111")
        name2 = safe_table_name("bbbbbb-2222-2222-2222-222222222222")
        assert name1 != name2


# ══════════════════════════════════════════════════════════════════════════════
#  7. AWS Configuration Loading
# ══════════════════════════════════════════════════════════════════════════════

class TestAWSConfiguration:
    def test_is_aws_configured_false_without_bucket(self):
        from app.data_engineering.aws_client import is_aws_configured
        with patch("app.data_engineering.aws_client.settings") as mock_settings:
            mock_settings.S3_BUCKET_NAME = None
            result = is_aws_configured()
        assert result is False

    def test_is_aws_configured_false_on_credential_error(self):
        from app.data_engineering.aws_client import is_aws_configured
        from app.core.exceptions import AWSUnavailableException
        with patch("app.data_engineering.aws_client.settings") as mock_settings:
            mock_settings.S3_BUCKET_NAME = "test-bucket"
            with patch("app.data_engineering.aws_client.get_boto3_session", side_effect=AWSUnavailableException()):
                result = is_aws_configured()
        assert result is False

    def test_settings_has_correct_defaults(self):
        from app.core.config import Settings
        s = Settings(
            AWS_REGION="ap-south-1",
            ATHENA_WORKGROUP="data-detective",
            ATHENA_DATABASE="data_detective",
        )
        assert s.AWS_REGION == "ap-south-1"
        assert s.ATHENA_WORKGROUP == "data-detective"
        assert s.S3_RAW_PREFIX == "raw/"
        assert s.S3_CURATED_PREFIX == "curated/"


# ══════════════════════════════════════════════════════════════════════════════
#  8. Pipeline Local Fallback
# ══════════════════════════════════════════════════════════════════════════════

class TestPipelineLocalFallback:
    def test_pipeline_returns_local_when_aws_not_configured(self):
        from app.data_engineering.pipeline import run_pipeline, STATUS_LOCAL
        mock_db = MagicMock()
        with patch("app.data_engineering.pipeline.is_aws_configured", return_value=False):
            with patch("app.data_engineering.pipeline.DatasetRepository") as mock_repo:
                mock_repo.update_pipeline_fields = MagicMock()
                result = run_pipeline(
                    dataset_id="test-123",
                    content=b"name,age\nAlice,30",
                    original_filename="test.csv",
                    file_extension=".csv",
                    content_type="text/csv",
                    detected_types={"name": "Text", "age": "Integer"},
                    db=mock_db,
                )
        assert result.pipeline_status == STATUS_LOCAL
        assert result.raw_s3_key is None
        assert result.curated_s3_key is None

    def test_pipeline_handles_s3_failure_gracefully(self):
        from app.data_engineering.pipeline import run_pipeline, STATUS_FAILED
        from app.core.exceptions import S3Exception
        mock_db = MagicMock()
        with patch("app.data_engineering.pipeline.is_aws_configured", return_value=True):
            with patch("app.data_engineering.pipeline.DatasetRepository") as mock_repo:
                mock_repo.update_pipeline_fields = MagicMock()
                with patch("app.data_engineering.pipeline.upload_raw_file", side_effect=S3Exception("S3 down")):
                    result = run_pipeline(
                        dataset_id="test-456",
                        content=b"name,age\nBob,25",
                        original_filename="test.csv",
                        file_extension=".csv",
                        content_type="text/csv",
                        detected_types={},
                        db=mock_db,
                    )
        assert result.pipeline_status == STATUS_FAILED
        assert result.pipeline_error is not None
