"""
Phase 2C — AI Data Engineering Code Generator business logic service.
Consumes Phase 2A dataset profiling results and Phase 2B AI context to generate
production-ready SQL and PySpark code transformations with step-by-step explanations.
Generated code is NEVER executed on the backend.
"""
import logging
from typing import Dict, Any, Optional, List

from app.ai.service import _call_gemini_with_retry, _parse_json_response
from app.core.config import get_settings
from app.core.exceptions import AIException
from app.code_generation.prompts import (
    build_sql_prompt,
    build_pyspark_prompt,
    SQL_SYSTEM_INSTRUCTION,
    PYSPARK_SYSTEM_INSTRUCTION,
)
from app.code_generation.schemas import (
    SQLGenerationResponse,
    PySparkGenerationResponse,
)
from app.code_generation.validators import (
    validate_code_safety,
    validate_column_availability,
    validate_sql_code,
    validate_pyspark_code,
)

logger = logging.getLogger(__name__)


class CodeGenerationService:
    """
    Service for generating SQL and PySpark code transformations from natural language.
    Consumes structured profiling metadata — never duplicates profiling logic or executes code.
    """

    @staticmethod
    def generate_sql(
        profile_data: Dict[str, Any],
        instruction: str,
        dialect: Optional[str] = None
    ) -> SQLGenerationResponse:
        """
        Generates SQL query/transformation script based on dataset profile & user instruction.
        """
        if not profile_data:
            raise AIException("Profile data is empty. Cannot generate SQL.")

        instruction_strip = instruction.strip() if instruction else ""
        if not instruction_strip:
            raise AIException("Instruction cannot be empty.")

        settings = get_settings()
        target_dialect = dialect or getattr(settings, "SQL_DIALECT", "generic") or "generic"

        # Check for non-existent columns requested by user
        matched_cols, column_warnings = validate_column_availability(instruction_strip, profile_data)

        prompt = build_sql_prompt(profile_data, instruction_strip, target_dialect)
        raw_text = _call_gemini_with_retry(prompt, system_instruction=SQL_SYSTEM_INSTRUCTION)
        parsed = _parse_json_response(raw_text)

        code = parsed.get("code", "").strip()
        explanation = parsed.get("explanation", [])
        used_columns = parsed.get("used_columns", matched_cols)
        ai_warnings = parsed.get("warnings", [])
        confidence = parsed.get("confidence", "high")
        if confidence not in ("low", "medium", "high"):
            confidence = "medium"

        # Merge column warnings and AI warnings (deduplicated)
        all_warnings = list(dict.fromkeys(column_warnings + ai_warnings))

        # Perform safety check on generated code
        is_safe, safety_err = validate_code_safety(code)
        if not is_safe:
            logger.error(f"Generated SQL failed safety check: {safety_err}")
            raise AIException(f"Generated code failed security check: {safety_err}")

        # Perform lightweight SQL syntax validation
        is_valid_sql, sql_msg = validate_sql_code(code)
        if not is_valid_sql:
            logger.warning(f"Generated SQL syntax warning: {sql_msg}")
            all_warnings.append(f"Syntax validation note: {sql_msg}")

        # Filter used_columns against actual columns
        actual_cols = list(profile_data.get("columns", {}).keys())
        valid_used_cols = [c for c in used_columns if c in actual_cols]
        if not valid_used_cols and matched_cols:
            valid_used_cols = matched_cols

        return SQLGenerationResponse(
            language="sql",
            dialect=target_dialect,
            code=code,
            explanation=explanation if isinstance(explanation, list) else [str(explanation)],
            used_columns=valid_used_cols,
            warnings=all_warnings,
            confidence=confidence,
        )

    @staticmethod
    def generate_pyspark(
        profile_data: Dict[str, Any],
        instruction: str
    ) -> PySparkGenerationResponse:
        """
        Generates PySpark transformation script based on dataset profile & user instruction.
        """
        if not profile_data:
            raise AIException("Profile data is empty. Cannot generate PySpark.")

        instruction_strip = instruction.strip() if instruction else ""
        if not instruction_strip:
            raise AIException("Instruction cannot be empty.")

        # Check for non-existent columns requested by user
        matched_cols, column_warnings = validate_column_availability(instruction_strip, profile_data)

        prompt = build_pyspark_prompt(profile_data, instruction_strip)
        raw_text = _call_gemini_with_retry(prompt, system_instruction=PYSPARK_SYSTEM_INSTRUCTION)
        parsed = _parse_json_response(raw_text)

        code = parsed.get("code", "").strip()
        explanation = parsed.get("explanation", [])
        used_columns = parsed.get("used_columns", matched_cols)
        ai_warnings = parsed.get("warnings", [])
        confidence = parsed.get("confidence", "high")
        if confidence not in ("low", "medium", "high"):
            confidence = "medium"

        dataset_path_var = parsed.get("dataset_path_variable", "DATASET_PATH")

        # Merge column warnings and AI warnings (deduplicated)
        all_warnings = list(dict.fromkeys(column_warnings + ai_warnings))

        # Perform safety check on generated code
        is_safe, safety_err = validate_code_safety(code)
        if not is_safe:
            logger.error(f"Generated PySpark failed safety check: {safety_err}")
            raise AIException(f"Generated code failed security check: {safety_err}")

        # Perform Python AST syntax validation
        is_valid_syntax, syntax_msg = validate_pyspark_code(code)
        if not is_valid_syntax:
            logger.warning(f"Generated PySpark AST validation warning: {syntax_msg}")
            all_warnings.append(f"Python syntax note: {syntax_msg}")

        # Filter used_columns against actual columns
        actual_cols = list(profile_data.get("columns", {}).keys())
        valid_used_cols = [c for c in used_columns if c in actual_cols]
        if not valid_used_cols and matched_cols:
            valid_used_cols = matched_cols

        return PySparkGenerationResponse(
            language="pyspark",
            code=code,
            explanation=explanation if isinstance(explanation, list) else [str(explanation)],
            used_columns=valid_used_cols,
            warnings=all_warnings,
            confidence=confidence,
            dataset_path_variable=dataset_path_var,
        )
