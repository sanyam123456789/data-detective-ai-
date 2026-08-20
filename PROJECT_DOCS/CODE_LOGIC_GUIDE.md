# 8. Code Logic Guide — Data Detective AI

---

## 1. Important Backend Algorithms & Functions

---

### Function 1: Column Data Type Inference
- **File & Function:** `backend/app/profiling/profiler.py` $\to$ `DatasetProfiler._infer_data_type(series: pd.Series) -> str`
- **Purpose:** Accurately classifies a column into one of 6 semantic types: `Integer`, `Float`, `Date`, `Boolean`, `Category`, or `Text`.
- **Logic Step-by-Step:**
  1. Drops null/NaN values from the sample.
  2. If all values are boolean-like (`True/False`, `1/0`, `yes/no`), returns `"Boolean"`.
  3. Checks if series is numeric (`pd.api.types.is_numeric_dtype`).
     - If numeric and all values equal their integer conversion without remainder, returns `"Integer"`.
     - Otherwise, returns `"Float"`.
  4. If string/object type, attempts date parsing using `pd.to_datetime()` with error coercion. If $\ge 80\%$ of non-null values parse as valid timestamps, returns `"Date"`.
  5. If the number of unique distinct values is low relative to the total rows ($\text{distinct} < 50$ and $\text{distinct} / \text{total} < 0.2$), returns `"Category"`.
  6. Otherwise, defaults to `"Text"`.
- **Why it matters:** In raw CSVs, every column starts as a generic string. Accurate type inference is required to compute valid statistics and build AWS Glue schemas.

---

### Function 2: Outlier Detection (IQR & Z-Score)
- **File & Function:** `backend/app/quality_engine/outliers.py` $\to$ `detect_outliers(series: pd.Series, method: str = 'iqr') -> Dict[str, Any]`
- **Algorithms:**
  1. **Interquartile Range (IQR):**
     - Calculates First Quartile ($Q_1 = 25\text{th percentile}$) and Third Quartile ($Q_3 = 75\text{th percentile}$).
     - Computes $\text{IQR} = Q_3 - Q_1$.
     - Computes lower bound: $\text{Lower} = Q_1 - 1.5 \times \text{IQR}$.
     - Computes upper bound: $\text{Upper} = Q_3 + 1.5 \times \text{IQR}$.
     - Any value $x < \text{Lower}$ or $x > \text{Upper}$ is flagged as an outlier.
  2. **Z-Score Method:**
     - Computes mean ($\mu$) and standard deviation ($\sigma$).
     - Computes standard score: $Z = \frac{x - \mu}{\sigma}$.
     - Any value with $|Z| > 3.0$ is flagged as an extreme statistical anomaly.

---

### Function 3: Multi-Dimensional Quality Health Scoring
- **File & Function:** `backend/app/quality_engine/engine.py` $\to$ `QualityAuditEngine.audit_dataset(df: pd.DataFrame) -> QualityAuditResponse`
- **Scoring Formula:**
  $$\text{Health Score} = 0.30 \times C + 0.30 \times V + 0.20 \times U + 0.20 \times S$$
  Where:
  - $C$ (**Completeness Score**): $100 - (\text{Null Percentage} \times 100)$.
  - $V$ (**Validity Score**): Percentage of values passing regex and type constraints.
  - $U$ (**Uniqueness Score**): $100 - (\text{Duplicate Row Percentage} \times 100)$.
  - $S$ (**Consistency Score**): $100 - (\text{Inconsistency Percentage} \times 100)$ (flags whitespace & casing drift).

---

### Function 4: Autonomous AI Analyst Pipeline
- **File & Function:** `backend/app/ai/analyst_service.py` $\to$ `AIAnalystService.investigate(dataset_id: str, question: str) -> AIAnalystResponse`
- **Multi-Step Execution Logic:**
  1. **Schema Retrieval:** Fetches Glue table name and column metadata.
  2. **SQL Synthesis:** Prompts Gemini with table schema and question $\to$ Gemini writes an optimized ANSI Athena SQL `SELECT` query.
  3. **Safety Validation:** Runs `_validate_sql_safety(sql)` ensuring no destructive DDL/DML keywords (`DROP`, `DELETE`, `UPDATE`, `INSERT`, `ALTER`, `TRUNCATE`) exist.
  4. **Athena Execution:** Invokes `athena_service.run_query(sql, database, workgroup)`. Boto3 submits query to AWS, polls until completion, and returns output rows + telemetry (execution time in ms, MB scanned).
  5. **Root-Cause Synthesis:** Sends SQL query results + original question to Gemini with instructions to output root-cause findings and strategic recommendations.
  6. **Return Payload:** Combines SQL, execution telemetry, result rows, and AI synthesis into a single response model.

---

### Function 5: SQL & PySpark Code Generation
- **File & Function:** `backend/app/code_generation/service.py` $\to$ `CodeGenerationService.generate_sql()` / `generate_pyspark()`
- **Logic:**
  - Builds a structured system prompt injecting column names, inferred data types, and the user's objective (e.g. *"Filter out negative fare amounts and remove duplicate users"*).
  - Enforces production best practices:
    - In SQL: Uses CTEs (`WITH cleaned AS (...)`) and explicit column casts.
    - In PySpark: Uses `pyspark.sql.functions` (`col`, `when`, `dropDuplicates`, `withColumn`).
  - Cleans markdown fences (` ```sql ` or ` ```python `) and returns clean executable code.
