"""
Unit tests for the AI client module.
Uses unittest.mock to avoid requiring a real Gemini API key.
"""
import pytest
from unittest.mock import patch, MagicMock


class TestGetGeminiClient:
    """Tests for get_gemini_client() initialization."""

    def test_raises_ai_configuration_exception_when_api_key_missing(self):
        """Missing GEMINI_API_KEY should raise AIConfigurationException."""
        from app.core.exceptions import AIConfigurationException

        with patch("app.ai.client.get_gemini_client") as mock_get:
            mock_get.side_effect = AIConfigurationException("GEMINI_API_KEY is not configured.")
            with pytest.raises(AIConfigurationException) as exc_info:
                mock_get()
            assert "GEMINI_API_KEY" in str(exc_info.value)

    def test_raises_ai_configuration_exception_when_api_key_empty(self):
        """Empty GEMINI_API_KEY should raise AIConfigurationException."""
        from app.core.exceptions import AIConfigurationException

        with patch("app.core.config.settings") as mock_settings:
            mock_settings.GEMINI_API_KEY = ""
            mock_settings.GEMINI_MODEL = "gemini-2.5-flash"

            from app.core.exceptions import AIConfigurationException
            with patch("app.ai.client.get_gemini_client") as mock_fn:
                mock_fn.side_effect = AIConfigurationException("GEMINI_API_KEY is not configured.")
                with pytest.raises(AIConfigurationException):
                    mock_fn()

    def test_client_initializes_with_valid_api_key(self):
        """Valid API key should produce a client without error."""
        mock_client = MagicMock()
        with patch("app.ai.client.get_gemini_client", return_value=mock_client):
            from app.ai.client import get_gemini_client
            client = get_gemini_client()
            assert client is not None

    def test_get_model_name_returns_configured_model(self):
        """get_model_name() should return GEMINI_MODEL from settings."""
        with patch("app.core.config.settings") as mock_settings:
            mock_settings.GEMINI_MODEL = "gemini-2.5-flash"
            with patch("app.ai.client.get_model_name", return_value="gemini-2.5-flash"):
                from app.ai.client import get_model_name
                model = get_model_name()
                assert isinstance(model, str)
                assert len(model) > 0

    def test_get_model_name_has_fallback(self):
        """get_model_name() should never return None or empty string."""
        with patch("app.ai.client.get_model_name", return_value="gemini-2.5-flash"):
            from app.ai.client import get_model_name
            model = get_model_name()
            assert model is not None
            assert model.strip() != ""


class TestGeminiPackageImport:
    """Tests for google-genai package availability."""

    def test_import_error_raises_configuration_exception(self):
        """If google-genai is not installed, a clear error should be raised."""
        from app.core.exceptions import AIConfigurationException

        with patch("app.ai.client.get_gemini_client") as mock_fn:
            mock_fn.side_effect = AIConfigurationException(
                "google-genai package is not installed."
            )
            with pytest.raises(AIConfigurationException) as exc_info:
                mock_fn()
            assert "google-genai" in str(exc_info.value).lower()
