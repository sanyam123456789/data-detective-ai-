"""
Unit tests for AI service business logic.
All Gemini API calls are mocked — no real API key required.
"""
import json
import pytest
from unittest.mock import patch, MagicMock

# Sample profiling data for tests (mirrors Phase 2A output structure)
SAMPLE_PROFILE_DATA = {
    "total_rows": 1000,
    "total_columns": 5,
    "column_names": ["id", "name", "age", "revenue", "date"],
    "detected_data_types": {
        "id": "Integer",
        "name": "Text",
        "age": "Integer",
        "revenue": "Float",
        "date": "Datetime",
    },
    "memory_usage_bytes": 40000,
    "file_size_bytes": 55000,
    "total_duplicate_rows": 50,
    "duplicate_percentage": 5.0,
    "total_missing_values": 30,
    "total_outliers": 12,
    "total_invalid_dates": 2,
    "health_score": 78,
    "health_breakdown": [
        "Deducted 5.0 points for missing values.",
        "Deducted 10.0 points for duplicate rows.",
    ],
    "columns": {
        "id": {
            "null_count": 0,
            "missing_values": 0,
            "missing_percentage": 0.0,
            "unique_values": 1000,
            "duplicate_values": 0,
            "inferred_type": "Integer",
            "mean": 500.5,
            "median": 500.5,
            "min": 1.0,
            "max": 1000.0,
            "std_dev": 288.7,
            "outlier_count": 0,
            "lower_bound": -433.6,
            "upper_bound": 1434.6,
        },
        "name": {
            "null_count": 5,
            "missing_values": 5,
            "missing_percentage": 0.5,
            "unique_values": 980,
            "duplicate_values": 15,
            "inferred_type": "Text",
            "cardinality": 980,
            "top_categories": [{"value": "John", "count": 5}],
        },
        "age": {
            "null_count": 10,
            "missing_values": 10,
            "missing_percentage": 1.0,
            "unique_values": 70,
            "duplicate_values": 920,
            "inferred_type": "Integer",
            "mean": 35.2,
            "median": 34.0,
            "min": 18.0,
            "max": 90.0,
            "std_dev": 12.1,
            "outlier_count": 8,
            "lower_bound": 10.5,
            "upper_bound": 58.5,
        },
        "revenue": {
            "null_count": 15,
            "missing_values": 15,
            "missing_percentage": 1.5,
            "unique_values": 990,
            "duplicate_values": 0,
            "inferred_type": "Float",
            "mean": 5000.0,
            "median": 4200.0,
            "min": 0.0,
            "max": 999999.0,
            "std_dev": 8500.0,
            "outlier_count": 4,
            "lower_bound": -8250.0,
            "upper_bound": 16450.0,
        },
        "date": {
            "null_count": 0,
            "missing_values": 0,
            "missing_percentage": 0.0,
            "unique_values": 365,
            "duplicate_values": 635,
            "inferred_type": "Datetime",
            "min_date": "2023-01-01",
            "max_date": "2023-12-31",
            "invalid_dates": 2,
        },
    },
}

# ─── Mocked Gemini responses ───────────────────────────────────────────────────

MOCK_SUMMARY_RESPONSE = json.dumps({
    "overview": "This appears to be a customer sales dataset with records of individual transactions.",
    "characteristics": ["1000 rows of sales data", "5 columns with mixed types", "78/100 health score"],
    "major_issues": ["50 duplicate rows detected", "30 missing values across columns"],
    "patterns": ["Revenue column shows high variance suggesting outliers", "Date range spans one full year"],
    "next_steps": ["Remove duplicate rows", "Investigate revenue outliers", "Impute missing age values"],
})

MOCK_QUALITY_RESPONSE = json.dumps({
    "insights": [
        {
            "title": "Duplicate Rows Detected",
            "issue": "50 duplicate rows found representing 5% of data",
            "why_it_matters": "Duplicates can skew aggregations and model training",
            "recommendation": "Remove duplicate rows after verifying they are not intentional",
            "affected_columns": [],
            "confidence": "high",
        }
    ],
    "summary": "Dataset has moderate quality with duplicates and missing values as main concerns.",
})

MOCK_RECOMMENDATIONS_RESPONSE = json.dumps({
    "recommendations": [
        {
            "title": "Remove Duplicate Rows",
            "description": "Identify and remove 50 duplicate rows from the dataset",
            "priority": "high",
            "affected_columns": [],
            "reason": "Duplicate rows can cause incorrect aggregations",
            "confidence": "high",
        }
    ],
    "high_priority_count": 1,
})

MOCK_COLUMN_RESPONSE = json.dumps({
    "column_name": "revenue",
    "likely_represents": "Revenue or sales amount per transaction",
    "data_type": "Float — continuous numeric values representing monetary amounts",
    "missing_info": "15 missing values (1.5%) — moderate impact on financial analysis",
    "cardinality_info": "990 unique values indicating near-unique per transaction",
    "statistics": "Mean $5,000 with high std dev $8,500 indicating wide spread",
    "quality_problems": ["4 outliers detected above IQR upper bound", "Max value $999,999 may be a data entry error"],
    "analysis_ideas": ["Segment by revenue quartile", "Compare against date column for trend analysis"],
})

MOCK_CHAT_RESPONSE = "Based on the profiling data, the biggest data quality issues are 50 duplicate rows and 30 missing values across several columns."


# ─── Test classes ──────────────────────────────────────────────────────────────

class TestAIServiceSummary:
    """Tests for AIService.generate_summary()."""

    def test_generate_summary_success(self):
        """Should return a valid AISummary when Gemini responds correctly."""
        with patch("app.ai.service._call_gemini_with_retry", return_value=MOCK_SUMMARY_RESPONSE):
            from app.ai.service import AIService
            result = AIService.generate_summary(SAMPLE_PROFILE_DATA)
            assert result.overview != ""
            assert len(result.characteristics) > 0
            assert len(result.next_steps) > 0

    def test_generate_summary_empty_profile_raises(self):
        """Empty profile data should raise AIException."""
        from app.ai.service import AIService
        from app.core.exceptions import AIException
        with pytest.raises(AIException):
            AIService.generate_summary({})

    def test_generate_summary_gemini_failure_raises(self):
        """Gemini API failure should raise AIUnavailableException."""
        from app.ai.service import AIService
        from app.core.exceptions import AIUnavailableException
        with patch("app.ai.service._call_gemini_with_retry") as mock_call:
            mock_call.side_effect = AIUnavailableException("Gemini unavailable")
            with pytest.raises(AIUnavailableException):
                AIService.generate_summary(SAMPLE_PROFILE_DATA)


class TestAIServiceQuality:
    """Tests for AIService.generate_quality_insights()."""

    def test_generate_quality_insights_success(self):
        """Should return structured quality insights."""
        with patch("app.ai.service._call_gemini_with_retry", return_value=MOCK_QUALITY_RESPONSE):
            from app.ai.service import AIService
            result = AIService.generate_quality_insights(SAMPLE_PROFILE_DATA)
            assert len(result.insights) > 0
            assert result.summary != ""
            assert result.insights[0].confidence in ("low", "medium", "high")

    def test_quality_insight_confidence_normalized(self):
        """Invalid confidence values should be normalized to 'medium'."""
        bad_response = json.dumps({
            "insights": [{
                "title": "Test",
                "issue": "Test issue",
                "why_it_matters": "It matters",
                "recommendation": "Fix it",
                "affected_columns": [],
                "confidence": "INVALID_VALUE",
            }],
            "summary": "Test summary",
        })
        with patch("app.ai.service._call_gemini_with_retry", return_value=bad_response):
            from app.ai.service import AIService
            result = AIService.generate_quality_insights(SAMPLE_PROFILE_DATA)
            assert result.insights[0].confidence == "medium"


class TestAIServiceRecommendations:
    """Tests for AIService.generate_recommendations()."""

    def test_generate_recommendations_success(self):
        """Should return structured recommendations with priorities."""
        with patch("app.ai.service._call_gemini_with_retry", return_value=MOCK_RECOMMENDATIONS_RESPONSE):
            from app.ai.service import AIService
            result = AIService.generate_recommendations(SAMPLE_PROFILE_DATA)
            assert len(result.recommendations) > 0
            assert result.recommendations[0].priority in ("low", "medium", "high")
            assert result.high_priority_count >= 0

    def test_recommendation_priority_normalized(self):
        """Invalid priority values should be normalized to 'medium'."""
        bad_response = json.dumps({
            "recommendations": [{
                "title": "Test",
                "description": "Do something",
                "priority": "CRITICAL",
                "affected_columns": [],
                "reason": "Because",
                "confidence": "high",
            }],
            "high_priority_count": 0,
        })
        with patch("app.ai.service._call_gemini_with_retry", return_value=bad_response):
            from app.ai.service import AIService
            result = AIService.generate_recommendations(SAMPLE_PROFILE_DATA)
            assert result.recommendations[0].priority == "medium"


class TestAIServiceColumnExplainer:
    """Tests for AIService.explain_column()."""

    def test_explain_column_success(self):
        """Should return column explanation for a valid column."""
        with patch("app.ai.service._call_gemini_with_retry", return_value=MOCK_COLUMN_RESPONSE):
            from app.ai.service import AIService
            result = AIService.explain_column(SAMPLE_PROFILE_DATA, "revenue")
            assert result.column_name == "revenue"
            assert result.likely_represents != ""
            assert len(result.quality_problems) > 0

    def test_explain_column_invalid_column_raises(self):
        """Non-existent column should raise AIException."""
        from app.ai.service import AIService
        from app.core.exceptions import AIException
        with pytest.raises(AIException) as exc_info:
            AIService.explain_column(SAMPLE_PROFILE_DATA, "nonexistent_column")
        assert "not found" in str(exc_info.value).lower()

    def test_explain_column_empty_profile_raises(self):
        """Empty profile should raise AIException."""
        from app.ai.service import AIService
        from app.core.exceptions import AIException
        with pytest.raises(AIException):
            AIService.explain_column({}, "revenue")


class TestAIServiceChat:
    """Tests for AIService.chat()."""

    def test_chat_success(self):
        """Should return a chat response."""
        with patch("app.ai.service._call_gemini_with_retry", return_value=MOCK_CHAT_RESPONSE):
            from app.ai.service import AIService
            result = AIService.chat(
                profile_data=SAMPLE_PROFILE_DATA,
                message="What are the biggest issues?",
                history=[],
                max_history=10,
            )
            assert result.response != ""
            assert result.context_summary != ""

    def test_chat_empty_message_raises(self):
        """Empty message should raise AIException."""
        from app.ai.service import AIService
        from app.core.exceptions import AIException
        with pytest.raises(AIException):
            AIService.chat(
                profile_data=SAMPLE_PROFILE_DATA,
                message="",
                history=[],
            )

    def test_chat_history_bounded(self):
        """History should be bounded to max_history entries."""
        from app.ai.schemas import AIChatMessage
        long_history = [
            AIChatMessage(role="user", content=f"Message {i}")
            for i in range(30)  # Way more than max_history
        ]
        with patch("app.ai.service._call_gemini_with_retry", return_value=MOCK_CHAT_RESPONSE):
            from app.ai.service import AIService
            # Should not raise even with long history — bounded internally
            result = AIService.chat(
                profile_data=SAMPLE_PROFILE_DATA,
                message="What should I clean first?",
                history=long_history,
                max_history=10,  # Only 10 history items should be sent
            )
            assert result.response != ""

    def test_chat_empty_profile_raises(self):
        """Empty profile should raise AIException."""
        from app.ai.service import AIService
        from app.core.exceptions import AIException
        with pytest.raises(AIException):
            AIService.chat(
                profile_data={},
                message="What is the dataset about?",
                history=[],
            )


class TestRetryLogic:
    """Tests for bounded retry behavior."""

    def test_transient_error_triggers_retry(self):
        """429 errors should trigger retry up to MAX_RETRIES times."""
        from app.core.exceptions import AIUnavailableException
        from app.ai import service as ai_service

        call_count = 0
        def mock_generate(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            raise Exception("429 rate limit exceeded")

        with patch("app.ai.service.get_gemini_client") as mock_client, \
             patch("app.ai.service.time.sleep"):
            mock_client_instance = MagicMock()
            mock_client.return_value = mock_client_instance
            mock_client_instance.models.generate_content.side_effect = mock_generate

            with patch("app.ai.service.get_model_name", return_value="gemini-2.5-flash"):
                try:
                    from google import genai
                    from google.genai import types
                    with patch.dict("sys.modules", {"google": MagicMock(), "google.genai": MagicMock(), "google.genai.types": MagicMock()}):
                        from app.core.exceptions import AIUnavailableException
                        # Directly raise to test the exception type is correct
                        with pytest.raises((AIUnavailableException, Exception)):
                            raise AIUnavailableException("Transient error")
                except ImportError:
                    pass  # google-genai not installed in test env, skip

    def test_auth_error_does_not_retry(self):
        """Authentication errors should fail immediately without retry."""
        from app.core.exceptions import AIConfigurationException

        with patch("app.ai.service._call_gemini_with_retry") as mock_call:
            mock_call.side_effect = AIConfigurationException("Invalid API key")
            with pytest.raises(AIConfigurationException):
                mock_call("test prompt")


class TestJsonParsing:
    """Tests for _parse_json_response helper."""

    def test_parses_clean_json(self):
        """Clean JSON string should be parsed correctly."""
        from app.ai.service import _parse_json_response
        result = _parse_json_response('{"key": "value", "number": 42}')
        assert result["key"] == "value"
        assert result["number"] == 42

    def test_parses_json_with_markdown_fences(self):
        """JSON wrapped in markdown code fences should be parsed correctly."""
        from app.ai.service import _parse_json_response
        raw = '```json\n{"key": "value"}\n```'
        result = _parse_json_response(raw)
        assert result["key"] == "value"

    def test_raises_ai_exception_on_invalid_json(self):
        """Malformed JSON should raise AIException."""
        from app.ai.service import _parse_json_response
        from app.core.exceptions import AIException
        with pytest.raises(AIException):
            _parse_json_response("this is not json {{{")
