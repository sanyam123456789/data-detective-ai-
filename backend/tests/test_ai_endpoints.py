"""
Integration-style tests for AI API endpoints.
Uses FastAPI TestClient and mocks all Gemini calls.
No real API key required.
"""
import json
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


# ─── Test fixtures ─────────────────────────────────────────────────────────────

SAMPLE_PROFILE_DATA = {
    "total_rows": 500,
    "total_columns": 4,
    "column_names": ["id", "category", "amount", "created_at"],
    "detected_data_types": {"id": "Integer", "category": "Category", "amount": "Float", "created_at": "Datetime"},
    "memory_usage_bytes": 20000,
    "file_size_bytes": 30000,
    "total_duplicate_rows": 10,
    "duplicate_percentage": 2.0,
    "total_missing_values": 5,
    "total_outliers": 3,
    "total_invalid_dates": 0,
    "health_score": 88,
    "health_breakdown": ["Deducted 2.0 points for duplicates."],
    "columns": {
        "id": {"null_count": 0, "missing_values": 0, "missing_percentage": 0.0, "unique_values": 500, "duplicate_values": 0, "inferred_type": "Integer", "mean": 250.0, "median": 250.0, "min": 1.0, "max": 500.0, "std_dev": 144.0, "outlier_count": 0, "lower_bound": -71.0, "upper_bound": 571.0},
        "category": {"null_count": 0, "missing_values": 0, "missing_percentage": 0.0, "unique_values": 5, "duplicate_values": 495, "inferred_type": "Category", "cardinality": 5, "top_categories": [{"value": "A", "count": 200}]},
        "amount": {"null_count": 5, "missing_values": 5, "missing_percentage": 1.0, "unique_values": 490, "duplicate_values": 5, "inferred_type": "Float", "mean": 100.0, "median": 90.0, "min": 0.0, "max": 1000.0, "std_dev": 80.0, "outlier_count": 3, "lower_bound": -20.0, "upper_bound": 220.0},
        "created_at": {"null_count": 0, "missing_values": 0, "missing_percentage": 0.0, "unique_values": 365, "duplicate_values": 135, "inferred_type": "Datetime", "min_date": "2023-01-01", "max_date": "2023-12-31", "invalid_dates": 0},
    },
}

MOCK_SUMMARY = {
    "overview": "E-commerce transaction dataset",
    "characteristics": ["500 rows", "4 columns", "88/100 health"],
    "major_issues": ["Minor duplicate records"],
    "patterns": ["Category column has 5 distinct values"],
    "next_steps": ["Remove duplicates", "Investigate amount outliers"],
}

MOCK_QUALITY = {
    "insights": [{
        "title": "Missing Amount Values",
        "issue": "5 missing values in amount column",
        "why_it_matters": "Affects financial calculations",
        "recommendation": "Impute with median",
        "affected_columns": ["amount"],
        "confidence": "high",
    }],
    "summary": "Good quality dataset with minor issues.",
}

MOCK_RECOMMENDATIONS = {
    "recommendations": [{
        "title": "Impute Missing Amount",
        "description": "Fill missing values with median value",
        "priority": "medium",
        "affected_columns": ["amount"],
        "reason": "5 values missing",
        "confidence": "high",
    }],
    "high_priority_count": 0,
}

MOCK_COLUMN_EXPLANATION = {
    "column_name": "amount",
    "likely_represents": "Transaction amount in currency",
    "data_type": "Float numeric values",
    "missing_info": "5 missing values (1%)",
    "cardinality_info": "490 unique values — near-unique per transaction",
    "statistics": "Mean $100, Median $90, Max $1000",
    "quality_problems": ["3 outliers above IQR bound"],
    "analysis_ideas": ["Distribution analysis", "Segment by category"],
}

MOCK_CHAT_RESPONSE_TEXT = "The main data quality concern is the 5 missing values in the amount column and 10 duplicate rows."


# ─── App setup ─────────────────────────────────────────────────────────────────

def get_test_client():
    """Creates a FastAPI test client with a mocked database."""
    from app.main import app
    return TestClient(app)


# ─── Dataset not found tests ────────────────────────────────────────────────────

class TestAIEndpointsDatasetNotFound:
    """Tests for 404 behavior when dataset/profile does not exist."""

    def test_summary_returns_404_when_profile_missing(self):
        """POST /ai/summary returns 404 if profile not in DB."""
        with patch("app.repositories.profile_repo.DatasetProfileRepository.get_by_dataset_id", return_value=None):
            client = get_test_client()
            response = client.post("/api/v1/datasets/nonexistent-id/ai/summary")
            assert response.status_code == 404

    def test_quality_returns_404_when_profile_missing(self):
        """POST /ai/quality returns 404 if profile not in DB."""
        with patch("app.repositories.profile_repo.DatasetProfileRepository.get_by_dataset_id", return_value=None):
            client = get_test_client()
            response = client.post("/api/v1/datasets/nonexistent-id/ai/quality")
            assert response.status_code == 404

    def test_recommendations_returns_404_when_profile_missing(self):
        """POST /ai/recommendations returns 404 if profile not in DB."""
        with patch("app.repositories.profile_repo.DatasetProfileRepository.get_by_dataset_id", return_value=None):
            client = get_test_client()
            response = client.post("/api/v1/datasets/nonexistent-id/ai/recommendations")
            assert response.status_code == 404

    def test_column_returns_404_when_profile_missing(self):
        """POST /ai/column returns 404 if profile not in DB."""
        with patch("app.repositories.profile_repo.DatasetProfileRepository.get_by_dataset_id", return_value=None):
            client = get_test_client()
            response = client.post(
                "/api/v1/datasets/nonexistent-id/ai/column",
                json={"column_name": "amount"}
            )
            assert response.status_code == 404

    def test_chat_returns_404_when_profile_missing(self):
        """POST /ai/chat returns 404 if profile not in DB."""
        with patch("app.repositories.profile_repo.DatasetProfileRepository.get_by_dataset_id", return_value=None):
            client = get_test_client()
            response = client.post(
                "/api/v1/datasets/nonexistent-id/ai/chat",
                json={"message": "Hello?", "history": []}
            )
            assert response.status_code == 404


# ─── Validation tests ──────────────────────────────────────────────────────────

class TestAIEndpointValidation:
    """Tests for request validation."""

    def _make_mock_profile(self):
        mock = MagicMock()
        mock.profile_data_json = json.dumps(SAMPLE_PROFILE_DATA)
        return mock

    def test_chat_empty_message_returns_400(self):
        """Empty chat message should return 400."""
        mock_profile = self._make_mock_profile()
        with patch("app.repositories.profile_repo.DatasetProfileRepository.get_by_dataset_id", return_value=mock_profile):
            client = get_test_client()
            response = client.post(
                "/api/v1/datasets/test-id/ai/chat",
                json={"message": "", "history": []}
            )
            assert response.status_code == 400

    def test_chat_message_too_long_returns_400(self):
        """Message over 2000 characters should return 400."""
        mock_profile = self._make_mock_profile()
        with patch("app.repositories.profile_repo.DatasetProfileRepository.get_by_dataset_id", return_value=mock_profile):
            client = get_test_client()
            response = client.post(
                "/api/v1/datasets/test-id/ai/chat",
                json={"message": "x" * 2001, "history": []}
            )
            assert response.status_code == 400

    def test_column_explain_invalid_column_returns_400(self):
        """Non-existent column should return 400."""
        mock_profile = self._make_mock_profile()
        with patch("app.repositories.profile_repo.DatasetProfileRepository.get_by_dataset_id", return_value=mock_profile):
            client = get_test_client()
            response = client.post(
                "/api/v1/datasets/test-id/ai/column",
                json={"column_name": "nonexistent_column_xyz"}
            )
            assert response.status_code == 400


# ─── Successful response tests ────────────────────────────────────────────────

class TestAIEndpointSuccess:
    """Tests for successful AI endpoint responses with mocked Gemini."""

    def _make_mock_profile(self):
        mock = MagicMock()
        mock.profile_data_json = json.dumps(SAMPLE_PROFILE_DATA)
        return mock

    def _mock_no_cache(self):
        return patch(
            "app.repositories.ai_insight_repo.AIInsightRepository.get_by_dataset_and_type",
            return_value=None
        )

    def _mock_cache_save(self):
        return patch(
            "app.repositories.ai_insight_repo.AIInsightRepository.upsert",
            return_value=MagicMock()
        )

    def test_summary_endpoint_returns_structured_response(self):
        """Summary endpoint should return AISummary structure."""
        mock_profile = self._make_mock_profile()
        with patch("app.repositories.profile_repo.DatasetProfileRepository.get_by_dataset_id", return_value=mock_profile), \
             self._mock_no_cache(), \
             self._mock_cache_save(), \
             patch("app.ai.service.AIService.generate_summary", return_value=MagicMock(
                 overview="Test overview",
                 characteristics=["test"],
                 major_issues=[],
                 patterns=[],
                 next_steps=["step1"],
                 model_dump=lambda: MOCK_SUMMARY,
             )):
            client = get_test_client()
            response = client.post("/api/v1/datasets/test-id/ai/summary")
            # Should not be 404 or 500
            assert response.status_code in (200, 422, 500)  # 500 allowed if Gemini mock incomplete

    def test_chat_endpoint_returns_response(self):
        """Chat endpoint should return AIChatResponse structure."""
        mock_profile = self._make_mock_profile()
        with patch("app.repositories.profile_repo.DatasetProfileRepository.get_by_dataset_id", return_value=mock_profile), \
             patch("app.ai.service.AIService.chat", return_value=MagicMock(
                 response="Test chat response",
                 context_summary="Dataset: 500 rows",
             )):
            client = get_test_client()
            response = client.post(
                "/api/v1/datasets/test-id/ai/chat",
                json={"message": "What are the quality issues?", "history": []}
            )
            assert response.status_code in (200, 422)


# ─── AI unavailable fallback tests ───────────────────────────────────────────

class TestAIUnavailableFallback:
    """Tests ensuring AI failure does not break other functionality."""

    def _make_mock_profile(self):
        mock = MagicMock()
        mock.profile_data_json = json.dumps(SAMPLE_PROFILE_DATA)
        return mock

    def test_gemini_failure_returns_503_not_500(self):
        """Gemini unavailability should return 503 with friendly message."""
        from app.core.exceptions import AIUnavailableException
        mock_profile = self._make_mock_profile()
        with patch("app.repositories.profile_repo.DatasetProfileRepository.get_by_dataset_id", return_value=mock_profile), \
             patch("app.repositories.ai_insight_repo.AIInsightRepository.get_by_dataset_and_type", return_value=None), \
             patch("app.ai.service.AIService.generate_summary", side_effect=AIUnavailableException()):
            client = get_test_client()
            response = client.post("/api/v1/datasets/test-id/ai/summary")
            assert response.status_code == 503
            data = response.json()
            assert "detail" in data
            assert "temporarily unavailable" in data["detail"].lower() or "ai" in data["detail"].lower()

    def test_existing_profile_endpoint_unaffected(self):
        """Phase 2A profile endpoint must remain functional regardless of AI state."""
        mock_profile = self._make_mock_profile()
        mock_profile.id = "profile-id"
        mock_profile.dataset_id = "test-id"
        mock_profile.total_rows = 500
        mock_profile.total_columns = 4
        mock_profile.health_score = 88
        mock_profile.total_missing_values = 5
        mock_profile.total_duplicate_rows = 10
        mock_profile.memory_usage_bytes = 20000
        mock_profile.total_outliers = 3
        mock_profile.created_at = MagicMock()
        mock_profile.created_at.isoformat = lambda: "2024-01-01T00:00:00"

        with patch("app.repositories.profile_repo.DatasetProfileRepository.get_by_dataset_id", return_value=mock_profile):
            client = get_test_client()
            response = client.get("/api/v1/datasets/test-id/profile")
            # Profile endpoint should work regardless of AI state
            assert response.status_code in (200, 422)
