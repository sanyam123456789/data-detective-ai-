"""
AI Intelligence Layer — Pydantic schemas for structured AI responses.
All AI API responses conform to these schemas so the frontend
receives predictable structured JSON.
"""
from typing import List, Optional, Literal
from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────
#  Feature 1 — AI Executive Summary
# ─────────────────────────────────────────────────

class AISummary(BaseModel):
    overview: str = Field(description="What the dataset likely represents")
    characteristics: List[str] = Field(description="Key dataset characteristics")
    major_issues: List[str] = Field(description="Major data quality issues detected")
    patterns: List[str] = Field(description="Notable patterns or observations")
    next_steps: List[str] = Field(description="Recommended next steps for the analyst")


# ─────────────────────────────────────────────────
#  Feature 2 — Data Quality Insights
# ─────────────────────────────────────────────────

class AIQualityInsight(BaseModel):
    title: str = Field(description="Short descriptive title of the issue")
    issue: str = Field(description="Description of the issue")
    why_it_matters: str = Field(description="Why this issue is important")
    recommendation: str = Field(description="Actionable recommendation")
    affected_columns: List[str] = Field(description="Column names affected by this issue")
    confidence: Literal["low", "medium", "high"] = Field(description="Confidence level")


class AIQualityResponse(BaseModel):
    insights: List[AIQualityInsight]
    summary: str = Field(description="Brief overall quality assessment")


# ─────────────────────────────────────────────────
#  Feature 3 — Cleaning Recommendations
# ─────────────────────────────────────────────────

class AIRecommendation(BaseModel):
    title: str = Field(description="Short title of the recommendation")
    description: str = Field(description="Detailed description of what to do")
    priority: Literal["low", "medium", "high"] = Field(description="Priority level")
    affected_columns: List[str] = Field(description="Columns this recommendation applies to")
    reason: str = Field(description="Why this recommendation is suggested")
    confidence: Literal["low", "medium", "high"] = Field(description="Confidence level")


class AIRecommendationsResponse(BaseModel):
    recommendations: List[AIRecommendation]
    high_priority_count: int = Field(description="Number of high priority recommendations")


# ─────────────────────────────────────────────────
#  Feature 4 — Column Explainer
# ─────────────────────────────────────────────────

class AIColumnRequest(BaseModel):
    column_name: str = Field(description="Name of the column to explain")


class AIColumnExplanation(BaseModel):
    column_name: str
    likely_represents: str = Field(description="What the column likely represents")
    data_type: str = Field(description="Detected data type and what it implies")
    missing_info: str = Field(description="Missing value analysis")
    cardinality_info: str = Field(description="Cardinality and uniqueness analysis")
    statistics: str = Field(description="Key statistical observations")
    quality_problems: List[str] = Field(description="Potential quality problems detected")
    analysis_ideas: List[str] = Field(description="Useful analysis ideas for this column")


# ─────────────────────────────────────────────────
#  Feature 5 — Dataset Chat
# ─────────────────────────────────────────────────

class AIChatMessage(BaseModel):
    role: Literal["user", "model"] = Field(description="Message author role")
    content: str = Field(description="Message content")


class AIChatRequest(BaseModel):
    message: str = Field(description="User's question or message")
    history: List[AIChatMessage] = Field(
        default=[],
        description="Previous conversation history"
    )
    max_history: int = Field(
        default=10,
        ge=1,
        le=20,
        description="Max number of history turns to include (bounded context)"
    )


class AIChatResponse(BaseModel):
    response: str = Field(description="AI response to the user's question")
    context_summary: str = Field(description="Brief summary of context used")


# ─────────────────────────────────────────────────
#  Shared — AI Cache metadata
# ─────────────────────────────────────────────────

class AIInsightCacheResponse(BaseModel):
    """Wrapper returned when a cached insight is served."""
    cached: bool = True
    insight_type: str
    data: dict


class AIAvailabilityStatus(BaseModel):
    available: bool
    message: str
