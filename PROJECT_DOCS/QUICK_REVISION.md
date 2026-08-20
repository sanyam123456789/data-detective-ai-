# 12. Quick Revision Sheet — Data Detective AI

---

## 1. Project Quick Facts (At a Glance)

- **Project:** Data Detective AI — Autonomous Data Quality & Lakehouse Platform.
- **Problem:** Raw data often contains nulls, invalid formats, duplicate rows, and extreme outliers that break production data pipelines and ML models.
- **Solution:** Automated statistical profiling, 4-dimension quality scoring, PySpark/SQL ETL code generation, AWS S3/Glue lakehouse sync, and an Autonomous AI Analyst.
- **Users:** Data Engineers, Analytics Engineers, Data Analysts, Product Teams.
- **Frontend Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Recharts, TanStack React Query.
- **Backend Stack:** Python 3.11+, FastAPI, Uvicorn, Pandas, SQLAlchemy 2.0, Pydantic v2.
- **Database:** SQLite (local development) / PostgreSQL (production).
- **AI / LLM:** Google Gemini 2.0 Flash (`google-genai` SDK).
- **Cloud Lakehouse:** AWS S3 (storage), AWS Glue (Data Catalog), Amazon Athena (serverless SQL engine).
- **Test Suite:** Pytest (102 unit and integration tests passing).

---

## 2. Explain My Project in 10 Lines

1. **Data Detective AI** is an autonomous data quality intelligence and lakehouse platform.
2. Users upload raw CSV or Excel files via a clean Next.js 14 web interface.
3. The FastAPI backend automatically infers column data types (Integer, Float, Date, Boolean, Category, Text).
4. It detects null values, format inconsistencies, duplicate rows, and statistical outliers using $1.5 \times \text{IQR}$ and Z-Score algorithms.
5. It computes a 4-dimension Quality Health Score (Completeness, Validity, Uniqueness, Consistency) from 0 to 100%.
6. It automatically normalizes and curates the dataset into an AWS S3 data lake.
7. It registers table definitions directly into the AWS Glue Data Catalog.
8. It uses Google Gemini 2.0 Flash to synthesize executive summaries, data quality defect reports, and cleaning playbooks.
9. Its Code Studio automatically writes production-grade cleaning code in ANSI SQL, DuckDB, Postgres, and PySpark.
10. Its Autonomous AI Analyst translates natural language business questions into Amazon Athena SQL, queries S3 serverlessly, and synthesizes root-cause recommendations.

---

## 3. Things I Must Remember

- **Gemini SDK import:** Always import `get_gemini_client` from `app.ai.client` (using the official `google-genai` SDK).
- **FastAPI Endpoints:** All routes live in `backend/app/api/v1/endpoints.py` under the `/api/v1` prefix.
- **Athena Workgroup Limit:** Amazon Athena queries run under workgroup `data-detective` with a strict 100MB scan limit to avoid cloud cost overruns.
- **Quality Score Formula:** $0.30 \times \text{Completeness} + 0.30 \times \text{Validity} + 0.20 \times \text{Uniqueness} + 0.20 \times \text{Consistency}$.
- **IQR Formula:** $\text{Lower} = Q_1 - 1.5 \times \text{IQR}$, $\text{Upper} = Q_3 + 1.5 \times \text{IQR}$.
- **AI Caching:** Executive summaries and playbooks are cached in the `ai_insights` database table to save LLM token costs.

---

## 4. 5 Questions the Interviewer Will Most Likely Ask

1. **"Can you walk me through the architecture of your project?"**
   $\rightarrow$ Mention the 3 layers: Next.js frontend $\to$ FastAPI application layer with Pandas & Gemini $\to$ SQLite metadata and AWS S3/Glue/Athena Lakehouse.
2. **"How do you detect statistical outliers in numeric columns?"**
   $\rightarrow$ Explain the Interquartile Range ($1.5 \times \text{IQR}$) and Z-Score ($|Z| > 3.0$) algorithms implemented in `backend/app/quality_engine/outliers.py`.
3. **"How does the Autonomous AI Analyst work from end to end?"**
   $\rightarrow$ Natural Language question $\to$ Gemini writes Athena SQL $\to$ Safety validation blocks DDL/DML $\to$ Athena queries S3 via Boto3 $\to$ Gemini synthesizes root cause.
4. **"Why did you choose FastAPI over Django or Flask?"**
   $\rightarrow$ High performance, built-in async support, automatic Pydantic validation, and auto-generated Swagger documentation.
5. **"How do you prevent malicious SQL execution in your AI Analyst?"**
   $\rightarrow$ We run `_validate_sql_safety()` with strict regex checking that only permits read-only `SELECT` queries and blocks `DROP`, `DELETE`, `UPDATE`, `ALTER`, and `INSERT`.

---

## 5. START HERE (Reading Roadmap)

If you want to master this project from zero to 100%, read the documentation files in this exact order:

1. **`01_PROJECT_OVERVIEW.md`** $\rightarrow$ High-level summary, problem statement, and 60-second pitch.
2. **`02_COMPLETE_FLOW.md`** $\rightarrow$ Step-by-step trace of how data flows from user click to database and AWS.
3. **`04_TECH_STACK.md`** $\rightarrow$ Why each library was chosen and what it does.
4. **`07_FEATURES_EXPLAINED.md`** $\rightarrow$ Deep dive into the 8 core features of the platform.
5. **`08_CODE_LOGIC_GUIDE.md`** $\rightarrow$ Mathematical algorithms (IQR, Z-Score, Data Type inference, Scoring formula).
6. **`05_API_AND_DATA_FLOW.md`** $\rightarrow$ Complete list of all REST API endpoints and payloads.
7. **`06_DATABASE_GUIDE.md`** $\rightarrow$ Database tables (`datasets`, `dataset_profiles`, `ai_insights`).
8. **`03_FOLDER_AND_FILE_GUIDE.md`** $\rightarrow$ Exact purpose of every backend and frontend file.
9. **`09_INTERVIEW_PREPARATION.md`** $\rightarrow$ Spoken interview answers and 30+ categorized technical questions.
10. **`11_KNOWN_ISSUES_AND_IMPROVEMENTS.md`** $\rightarrow$ Real limitations and production scaling strategies.
11. **`10_PROJECT_GLOSSARY.md`** $\rightarrow$ Quick reference dictionary of all data engineering and AI terms.
12. **`12_QUICK_REVISION.md`** $\rightarrow$ Your 5-minute pre-interview cheat sheet!
