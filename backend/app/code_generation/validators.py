"""
Phase 2C — Code generation safety and syntax validators.
Ensures generated code is safe, syntactically sound, and references actual dataset columns.
Generated code is NEVER executed on the backend.
"""
import ast
import re
from typing import Dict, Any, List, Tuple, Optional

# List of dangerous constructs that must NEVER appear in generated preview code
DANGEROUS_PATTERNS = [
    r"\beval\s*\(",
    r"\bexec\s*\(",
    r"\bsubprocess\b",
    r"\bos\.system\b",
    r"\bos\.popen\b",
    r"\bos\.remove\b",
    r"\bos\.rmdir\b",
    r"\bshutil\b",
    r"\b__import__\b",
    r"\bopen\s*\(",
    r"\bsocket\b",
    r"\bimport\s+os\b",
    r"\bimport\s+sys\b",
]


def validate_code_safety(code: str) -> Tuple[bool, Optional[str]]:
    """
    Validates that generated code does not contain any dangerous execution constructs.
    Returns (True, None) if safe, or (False, "Reason") if unsafe.
    """
    if not code or not code.strip():
        return False, "Code is empty."

    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, code, re.IGNORECASE):
            return False, f"Generated code contains disallowed security pattern: '{pattern}'"

    return True, None


def validate_column_availability(
    instruction: str,
    profile_data: Dict[str, Any]
) -> Tuple[List[str], List[str]]:
    """
    Inspects user instruction against actual profile columns.
    Returns (matched_columns, warnings).
    If user asks for a non-existent column (e.g. 'profit' when profit is not in dataset),
    generates a clear warning message listing available columns.
    """
    columns = profile_data.get("columns", {})
    col_names = list(columns.keys())
    col_names_lower = {c.lower(): c for c in col_names}

    matched_columns: List[str] = []
    warnings: List[str] = []

    # Simple word boundary token matching
    words = re.findall(r"\b[a-zA-Z_][a-zA-Z0-9_]*\b", instruction)
    for word in words:
        w_lower = word.lower()
        if w_lower in col_names_lower and col_names_lower[w_lower] not in matched_columns:
            matched_columns.append(col_names_lower[w_lower])

    # Check for common requested keywords like profit, revenue, price, age, cost, date if not in dataset
    common_targets = ["profit", "revenue", "cost", "salary", "price", "quantity", "discount", "target"]
    for target in common_targets:
        if target in instruction.lower() and target not in col_names_lower:
            avail_cols = ", ".join(col_names[:10])
            warnings.append(
                f"The dataset does not contain a column named '{target}'. "
                f"Available columns: {avail_cols}"
            )

    return matched_columns, warnings


def validate_sql_code(code: str) -> Tuple[bool, str]:
    """
    Lightweight validation for generated SQL code.
    Ensures code contains SQL keywords and is not raw conversational text.
    """
    code_strip = code.strip()
    if not code_strip:
        return False, "Generated SQL code is empty."

    sql_keywords = ["SELECT", "WITH", "CREATE", "UPDATE", "INSERT", "DELETE", "ALTER", "DROP"]
    has_sql_keyword = any(re.search(rf"\b{kw}\b", code_strip, re.IGNORECASE) for kw in sql_keywords)

    if not has_sql_keyword:
        return False, "Generated output does not contain valid SQL statements."

    return True, "Valid SQL code structure."


def validate_pyspark_code(code: str) -> Tuple[bool, str]:
    """
    Validates PySpark code Python syntax using AST parsing (without executing code).
    """
    code_strip = code.strip()
    if not code_strip:
        return False, "Generated PySpark code is empty."

    try:
        ast.parse(code_strip)
        return True, "Valid PySpark Python syntax."
    except SyntaxError as e:
        return False, f"PySpark Python syntax error at line {e.lineno}: {e.msg}"
