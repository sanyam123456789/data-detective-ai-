"""
Phase 4 — AI Analyst & Root Cause Engine Unit Tests
----------------------------------------------------
Tests for AIAnalystService pipeline and endpoint response models.
"""

import pytest
from unittest.mock import MagicMock, patch
from app.ai.schemas import AIAnalystRequest, AIAnalystResponse
from app.ai.analyst_service import AIAnalystService


def test_ai_analyst_request_schema():
    req = AIAnalystRequest(question="What is the total revenue?", max_rows=50)
    assert req.question == "What is the total revenue?"
    assert req.max_rows == 50


def test_ai_analyst_response_schema():
    res = AIAnalystResponse(
        question="What is total revenue?",
        generated_sql="SELECT SUM(revenue) FROM table;",
        execution_time_ms=120,
        data_scanned_mb=0.05,
        columns=["total_revenue"],
        rows=[["15000"]],
        row_count=1,
        executive_insight="Total revenue is $15,000.",
        key_findings=["Revenue generated from 100 transactions."],
        root_cause_explanation="Consistent sales growth observed.",
    )
    assert res.row_count == 1
    assert res.execution_time_ms == 120
    assert res.data_scanned_mb == 0.05


@patch("app.ai.analyst_service.get_gemini_client")
@patch("app.ai.analyst_service.run_query")

def test_ai_analyst_service_investigate_fallback(mock_run_query, mock_get_client):
    # Mock Gemini response
    mock_model = MagicMock()
    mock_model.generate_content.return_value.text = '{"sql": "SELECT * FROM test_table LIMIT 5;", "explanation": "Test"}'
    mock_client = MagicMock()
    mock_client.models = mock_model
    mock_get_client.return_value = mock_client

    # Mock Athena response
    mock_run_query.return_value = {
        "columns": ["id", "val"],
        "rows": [["1", "100"]],
        "execution_time_ms": 50,
        "data_scanned_bytes": 1024 * 1024,
    }

    profile_data = {
        "columns": {
            "id": {"inferred_type": "Integer"},
            "val": {"inferred_type": "Float"},
        }
    }

    result = AIAnalystService.investigate(
        question="Show sample rows",
        table_name="test_table",
        database_name="test_db",
        profile_data=profile_data,
        max_rows=5,
    )

    assert result.question == "Show sample rows"
    assert "SELECT" in result.generated_sql
    assert result.row_count == 1
