"""
AI Intelligence Layer — Gemini client initialization.

Uses the current official Google GenAI Python SDK:
  Package:  google-genai
  Import:   from google import genai

Never uses google-generativeai or GenerativeModel().
"""
import os
from typing import Optional
from app.core.exceptions import AIConfigurationException


def get_gemini_client():
    """
    Returns an initialized Google GenAI client.

    Reads GEMINI_API_KEY and GEMINI_MODEL from application settings.
    Raises AIConfigurationException if the API key is missing or empty.
    """
    try:
        from google import genai  # type: ignore[import]
    except ImportError:
        raise AIConfigurationException(
            "google-genai package is not installed. "
            "Run: pip install google-genai>=1.0.0"
        )

    from app.core.config import get_settings

    current_settings = get_settings()
    api_key: Optional[str] = current_settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")

    if not api_key or not api_key.strip():
        raise AIConfigurationException(
            "GEMINI_API_KEY is not configured. "
            "Add it to your .env file."
        )

    try:
        client = genai.Client(api_key=api_key.strip())
        return client
    except Exception as e:
        raise AIConfigurationException(
            f"Failed to initialize Gemini client: {str(e)}"
        )


def get_model_name() -> str:
    """Returns the configured Gemini model name from settings."""
    from app.core.config import get_settings
    current_settings = get_settings()
    model = getattr(current_settings, "GEMINI_MODEL", "gemini-3.6-flash") or os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
    return model or "gemini-3.6-flash"
