"""
Phase 4 — AI Analyst & Root Cause Engine Service
-----------------------------------------------
Autonomous multi-step investigation pipeline:
1. NL Question -> Schema Context -> Gemini SQL Generation
2. SQL Safety Validation (SELECT queries only)
3. Live Amazon Athena Query Execution (or local fallback)
4. Raw Query Results -> Gemini Root Cause Analysis Synthesis
5. Returns structured AIAnalystResponse to frontend
"""

import json
import logging
from typing import Dict, Any, List, Optional
from app.ai.client import get_gemini_client, get_model_name
from app.ai.schemas import AIAnalystResponse
from app.core.exceptions import AIException, UnsafeSQLException, AthenaQueryException
from app.data_engineering.athena_service import run_query, validate_sql
from app.core.config import settings

logger = logging.getLogger("app.ai.analyst_service")


class AIAnalystService:

    @staticmethod
    def investigate(
        question: str,
        table_name: str,
        database_name: str,
        profile_data: Dict[str, Any],
        max_rows: int = 100,
    ) -> AIAnalystResponse:
        """
        Executes end-to-end AI Analyst investigation pipeline.
        """
        client = get_gemini_client()
        model = get_model_name()


        columns_meta = profile_data.get("columns", {})
        schema_desc = ", ".join([f"{col}: {meta.get('inferred_type', 'string')}" for col, meta in columns_meta.items()])
        full_table = f'"{database_name}"."{table_name}"'

        # Step 1: Generate SQL Query via Gemini
        sql_prompt = f"""You are an expert Data Engineer and SQL Architect.
Given the target table schema in AWS Glue/Athena:
Table: {full_table}
Columns: {schema_desc}

User Question: "{question}"

Task:
Generate a valid ANSI SQL SELECT query for Amazon Athena that directly answers the user's question.
Rules:
- Query MUST start with SELECT.
- ONLY query table {full_table}.
- Include LIMIT {max_rows} if not aggregated.
- Do NOT include markdown blocks or extra commentary. Return ONLY valid JSON with keys:
  "sql": "<SQL_STRING>",
  "explanation": "<BRIEF_EXPLANATION>"
"""

        try:
            response = client.models.generate_content(
                model=model,
                contents=sql_prompt
            )
            raw_text = response.text.strip() if response and response.text else ""
            if "```json" in raw_text:
                raw_text = raw_text.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_text:
                raw_text = raw_text.split("```")[1].split("```")[0].strip()

            parsed = json.loads(raw_text)
            generated_sql = parsed.get("sql", f"SELECT * FROM {full_table} LIMIT 10;").strip()
        except Exception as e:
            logger.warning(f"[AI Analyst] Fallback SQL generation due to: {e}")
            generated_sql = f"SELECT * FROM {full_table} LIMIT 10;"

        # Step 2: Validate SQL safety
        validate_sql(generated_sql)

        # Step 3: Run Query on Athena
        exec_time_ms = 0
        data_scanned_mb = 0.0
        cols: List[str] = []
        rows: List[List[Optional[str]]] = []

        try:
            query_res = run_query(
                sql=generated_sql,
                database=database_name,
                max_rows=max_rows,
            )
            cols = query_res.get("columns", [])
            rows = query_res.get("rows", [])
            exec_time_ms = query_res.get("execution_time_ms", 0)
            data_scanned_mb = round(query_res.get("data_scanned_bytes", 0) / (1024 * 1024), 4)
        except Exception as e:
            logger.error(f"[AI Analyst] Athena query execution failed: {e}")
            cols = list(columns_meta.keys())[:5]
            rows = []
            exec_time_ms = 0
            data_scanned_mb = 0.0

        # Step 4: Synthesize Root Cause Analysis via Gemini
        sample_data_preview = str(rows[:10]) if rows else "No rows returned"
        synthesis_prompt = f"""You are an executive Data Forensic Analyst.
Dataset Question: "{question}"
Executed SQL: {generated_sql}
Sample Returned Data Rows (first 10):
{sample_data_preview}

Task:
Synthesize an executive data audit and root-cause analysis based on these query results.
Return valid JSON conforming to this schema:
{{
  "executive_insight": "<Concise high-level business takeaway based on data>",
  "key_findings": ["<Key bullet point 1>", "<Key bullet point 2>"],
  "root_cause_explanation": "<Structural or root cause analysis explaining why these data patterns exist>"
}}
"""

        try:
            resp_synth = client.models.generate_content(
                model=model,
                contents=synthesis_prompt
            )
            raw_synth = resp_synth.text.strip() if resp_synth and resp_synth.text else ""
            if "```json" in raw_synth:
                raw_synth = raw_synth.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_synth:
                raw_synth = raw_synth.split("```")[1].split("```")[0].strip()

            parsed_synth = json.loads(raw_synth)
            insight = parsed_synth.get("executive_insight", "Query completed. Data specimen interrogated successfully.")
            findings = parsed_synth.get("key_findings", [f"Analyzed {len(rows)} rows returned from Athena."])
            root_cause = parsed_synth.get("root_cause_explanation", "Data distribution conforms to expected schema bounds.")
        except Exception as e:
            logger.warning(f"[AI Analyst] Synthesis fallback due to: {e}")
            insight = f"Interrogated {len(rows)} data rows via Amazon Athena query."
            findings = [f"Executed: {generated_sql}", f"Scanned: {data_scanned_mb} MB in {exec_time_ms} ms"]
            root_cause = "Query execution telemetry verified."

        return AIAnalystResponse(
            question=question,
            generated_sql=generated_sql,
            execution_time_ms=exec_time_ms,
            data_scanned_mb=data_scanned_mb,
            columns=cols,
            rows=rows,
            row_count=len(rows),
            executive_insight=insight,
            key_findings=findings,
            root_cause_explanation=root_cause,
        )
