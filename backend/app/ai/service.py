"""
AI Intelligence Layer — Business logic service.

Calls Gemini using the current official google-genai SDK.
  from google import genai
  client = genai.Client(api_key=...)
  response = client.models.generate_content(model=..., contents=..., config=...)

Never calls Gemini on every page render.
Implements bounded retry for 429/5xx errors (max 2 retries).
Returns structured Pydantic objects. Does not expose API keys or stack traces.
"""
import json
import time
import logging
from typing import Dict, Any, List, Optional

from app.ai.client import get_gemini_client, get_model_name
from app.ai.prompts import (
    build_summary_prompt,
    build_quality_prompt,
    build_recommendations_prompt,
    build_column_prompt,
    build_chat_system_prompt,
    SYSTEM_INSTRUCTION,
)
from app.ai.schemas import (
    AISummary,
    AIQualityResponse,
    AIQualityInsight,
    AIRecommendationsResponse,
    AIRecommendation,
    AIColumnExplanation,
    AIChatMessage,
    AIChatResponse,
)
from app.core.exceptions import AIException, AIConfigurationException, AIUnavailableException

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────
#  Internal helpers
# ─────────────────────────────────────────────────

MAX_RETRIES = 2
RETRY_DELAY_SECONDS = 2


def _is_retryable_error(exception: Exception) -> bool:
    """Returns True if the error is a transient rate-limit or server error."""
    err_str = str(exception).lower()
    return any(code in err_str for code in ["429", "500", "503", "rate limit", "quota"])


def _call_gemini_with_retry(
    prompt: str,
    system_instruction: str = SYSTEM_INSTRUCTION
) -> str:
    """
    Calls Gemini generate_content with bounded retry logic.
    Returns the raw text response.
    Raises AIConfigurationException for auth errors (no retry).
    Raises AIUnavailableException for persistent transient errors.
    Raises AIException for other failures.
    """
    client = get_gemini_client()
    model_name = get_model_name()

    try:
        from google import genai  # type: ignore[import]
        from google.genai import types  # type: ignore[import]
    except ImportError:
        raise AIConfigurationException(
            "google-genai package is not installed. Run: pip install google-genai>=1.0.0"
        )

    last_exception: Optional[Exception] = None

    for attempt in range(MAX_RETRIES + 1):
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.3,
                    max_output_tokens=4096,
                )
            )

            if not response or not response.text:
                raise AIException("Gemini returned an empty response.")

            return response.text.strip()

        except AIConfigurationException:
            raise  # Never retry config/auth errors
        except Exception as e:
            err_type = type(e).__name__
            err_str = str(e)

            # Mask API key if present in error message
            api_key = getattr(client, "_api_key", None)
            if api_key and api_key in err_str:
                safe_err_str = err_str.replace(api_key, "[MASKED_API_KEY]")
            else:
                safe_err_str = err_str

            logger.error(f"Gemini API call error [{err_type}] on attempt {attempt + 1}: {safe_err_str}")

            err_lower = err_str.lower()
            # Don't retry authentication errors
            if any(code in err_lower for code in ["401", "403", "api key", "invalid key"]):
                raise AIConfigurationException(
                    "Gemini API authentication failed. Check your GEMINI_API_KEY."
                )

            last_exception = e
            if _is_retryable_error(e) and attempt < MAX_RETRIES:
                wait = RETRY_DELAY_SECONDS * (attempt + 1)
                logger.warning(f"Gemini transient error (attempt {attempt + 1}/{MAX_RETRIES + 1}): {safe_err_str}. Retrying in {wait}s...")
                time.sleep(wait)
            else:
                break

    raise AIUnavailableException(
        f"Gemini API is temporarily unavailable ({type(last_exception).__name__ if last_exception else 'Error'})."
    )


def _parse_json_response(raw_text: str) -> dict:
    """
    Parses the JSON response from Gemini.
    Strips markdown code fences if present, then parses JSON.
    """
    text = raw_text.strip()

    # Strip markdown code fences if Gemini included them
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first line (```json or ```) and last line (```)
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini JSON response: {e}\nRaw text: {text[:500]}")
        raise AIException(f"AI returned malformed response. Please try again.")


# ─────────────────────────────────────────────────
#  AI Service
# ─────────────────────────────────────────────────

class AIService:
    """
    Provides AI-powered analysis of dataset profiling results.
    Consumes Phase 2A structured profiling data — never duplicates profiling logic.
    """

    @staticmethod
    def generate_summary(profile_data: Dict[str, Any]) -> AISummary:
        """
        Feature 1: Generate an AI executive summary for the dataset.
        """
        if not profile_data:
            raise AIException("Profile data is empty. Cannot generate summary.")

        prompt = build_summary_prompt(profile_data)
        raw = _call_gemini_with_retry(prompt)
        parsed = _parse_json_response(raw)

        try:
            return AISummary(
                overview=parsed.get("overview", ""),
                characteristics=parsed.get("characteristics", []),
                major_issues=parsed.get("major_issues", []),
                patterns=parsed.get("patterns", []),
                next_steps=parsed.get("next_steps", []),
            )
        except Exception as e:
            logger.error(f"Schema validation failed for summary: {e}")
            raise AIException("AI returned an unexpected response format for summary.")

    @staticmethod
    def generate_quality_insights(profile_data: Dict[str, Any]) -> AIQualityResponse:
        """
        Feature 2: Generate structured data quality insights.
        """
        if not profile_data:
            raise AIException("Profile data is empty. Cannot generate quality insights.")

        prompt = build_quality_prompt(profile_data)
        raw = _call_gemini_with_retry(prompt)
        parsed = _parse_json_response(raw)

        try:
            insights = []
            for item in parsed.get("insights", []):
                confidence = item.get("confidence", "medium")
                if confidence not in ("low", "medium", "high"):
                    confidence = "medium"
                insights.append(AIQualityInsight(
                    title=item.get("title", ""),
                    issue=item.get("issue", ""),
                    why_it_matters=item.get("why_it_matters", ""),
                    recommendation=item.get("recommendation", ""),
                    affected_columns=item.get("affected_columns", []),
                    confidence=confidence,
                ))
            return AIQualityResponse(
                insights=insights,
                summary=parsed.get("summary", ""),
            )
        except Exception as e:
            logger.error(f"Schema validation failed for quality insights: {e}")
            raise AIException("AI returned an unexpected response format for quality insights.")

    @staticmethod
    def generate_recommendations(profile_data: Dict[str, Any]) -> AIRecommendationsResponse:
        """
        Feature 3: Generate data cleaning recommendations.
        """
        if not profile_data:
            raise AIException("Profile data is empty. Cannot generate recommendations.")

        prompt = build_recommendations_prompt(profile_data)
        raw = _call_gemini_with_retry(prompt)
        parsed = _parse_json_response(raw)

        try:
            recommendations = []
            for item in parsed.get("recommendations", []):
                priority = item.get("priority", "medium")
                if priority not in ("low", "medium", "high"):
                    priority = "medium"
                confidence = item.get("confidence", "medium")
                if confidence not in ("low", "medium", "high"):
                    confidence = "medium"
                recommendations.append(AIRecommendation(
                    title=item.get("title", ""),
                    description=item.get("description", ""),
                    priority=priority,
                    affected_columns=item.get("affected_columns", []),
                    reason=item.get("reason", ""),
                    confidence=confidence,
                ))

            high_count = sum(1 for r in recommendations if r.priority == "high")
            # Prefer Gemini's count but fallback to computed
            high_priority_count = parsed.get("high_priority_count", high_count)
            if not isinstance(high_priority_count, int):
                high_priority_count = high_count

            return AIRecommendationsResponse(
                recommendations=recommendations,
                high_priority_count=high_priority_count,
            )
        except Exception as e:
            logger.error(f"Schema validation failed for recommendations: {e}")
            raise AIException("AI returned an unexpected response format for recommendations.")

    @staticmethod
    def explain_column(
        profile_data: Dict[str, Any],
        column_name: str
    ) -> AIColumnExplanation:
        """
        Feature 4: Explain a specific column based on profiling data.
        """
        if not profile_data:
            raise AIException("Profile data is empty. Cannot explain column.")

        columns = profile_data.get("columns", {})
        if column_name not in columns:
            raise AIException(
                f"Column '{column_name}' was not found in the dataset profile. "
                f"Available columns: {', '.join(list(columns.keys())[:10])}"
            )

        prompt = build_column_prompt(profile_data, column_name)
        raw = _call_gemini_with_retry(prompt)
        parsed = _parse_json_response(raw)

        try:
            return AIColumnExplanation(
                column_name=column_name,
                likely_represents=parsed.get("likely_represents", ""),
                data_type=parsed.get("data_type", ""),
                missing_info=parsed.get("missing_info", ""),
                cardinality_info=parsed.get("cardinality_info", ""),
                statistics=parsed.get("statistics", ""),
                quality_problems=parsed.get("quality_problems", []),
                analysis_ideas=parsed.get("analysis_ideas", []),
            )
        except Exception as e:
            logger.error(f"Schema validation failed for column explanation: {e}")
            raise AIException("AI returned an unexpected response format for column explanation.")

    @staticmethod
    def chat(
        profile_data: Dict[str, Any],
        message: str,
        history: List[AIChatMessage],
        max_history: int = 10,
    ) -> AIChatResponse:
        """
        Feature 5: Chat with the AI about the dataset.
        Uses bounded conversation context (max_history turns).
        """
        if not profile_data:
            raise AIException("Profile data is empty. Cannot process chat request.")

        if not message or not message.strip():
            raise AIException("Chat message cannot be empty.")

        # Build the system context prompt (includes full profile data)
        system_context = build_chat_system_prompt(profile_data)

        # Bounded history — only keep the last max_history messages
        bounded_history = history[-max_history:] if len(history) > max_history else history

        # Build the conversation prompt
        conv_parts = []
        for msg in bounded_history:
            role_label = "User" if msg.role == "user" else "Assistant"
            conv_parts.append(f"{role_label}: {msg.content}")

        conv_parts.append(f"User: {message}")

        full_prompt = "\n".join(conv_parts)

        raw = _call_gemini_with_retry(full_prompt, system_instruction=system_context)

        col_count = profile_data.get("total_columns", 0)
        row_count = profile_data.get("total_rows", 0)
        health = profile_data.get("health_score", 0)
        context_summary = (
            f"Dataset: {row_count} rows × {col_count} columns | "
            f"Health: {health}/100 | "
            f"History turns: {len(bounded_history)}"
        )

        return AIChatResponse(
            response=raw,
            context_summary=context_summary,
        )
