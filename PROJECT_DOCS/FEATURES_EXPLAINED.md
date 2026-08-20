# 7. Features Explained — Data Detective AI

---

## 1. Feature Index

1. **Automated Data Profiler & Type Ingestion**
2. **Multi-Dimensional Quality Engine (Completeness, Validity, Uniqueness, Consistency)**
3. **Statistical Outlier Detection & Quarantine (IQR & Z-Score)**
4. **AI Intelligence Layer & Gemini Copilot**
5. **Interactive AI Chat & Investigator Terminal**
6. **Code Studio (SQL & PySpark Pipeline Generator)**
7. **AWS S3, Glue Data Catalog & Athena Lakehouse**
8. **Autonomous AI Analyst (Natural Language to Athena SQL & Root Cause)**

---

## 2. Deep Dive by Feature

---

### FEATURE 1: Automated Data Profiler & Type Ingestion
- **What does it do?** Ingests CSV or Excel files, automatically detects exact column data types (Integer, Float, Date, Boolean, Category, Text), computes null percentages, distinct value cardinality, and statistical moments (min, max, mean, stddev, quartiles).
- **Why does it exist?** Saves data teams hours of writing custom EDA (Exploratory Data Analysis) scripts.
- **Frontend Files:** `frontend/src/app/upload/page.tsx`, `frontend/src/app/datasets/[id]/page.tsx` (Tabs 1–5).
- **Backend Files:** `backend/app/profiling/profiler.py`, `backend/app/services/storage.py`.
- **API Endpoints:** `POST /api/v1/upload`, `GET /api/v1/datasets/{id}/profile`.
- **Potential Failure Modes:** Corrupt CSV files, non-standard encodings (e.g. ISO-8859-1 vs UTF-8), unparseable datetime formats.
- **How we handle it:** Fallback encodings (`latin1`, `utf-8-sig`), delimiter auto-detection (`csv.Sniffer`), and graceful fallback to "Text" if type parsing fails.

---

### FEATURE 2: Multi-Dimensional Quality Engine
- **What does it do?** Evaluates overall dataset quality score across 4 key dimensions:
  1. **Completeness (30%):** Flags null, NaN, and whitespace-only cells.
  2. **Validity (30%):** Validates email formats, phone numbers, UUIDs, ISO dates, and non-negative constraints.
  3. **Uniqueness (20%):** Detects identical duplicate row signatures and primary key collisions.
  4. **Consistency (20%):** Flags trailing/leading whitespace, mixed casing in categorical columns, and format drift.
- **Why does it exist?** A dataset might have 0 nulls but still be invalid due to malformed emails or inconsistent string casings.
- **Frontend Files:** `frontend/src/app/datasets/[id]/page.tsx` (Tab 9: Quality Engine).
- **Backend Files:** `backend/app/quality_engine/` (`engine.py`, `completeness.py`, `validity.py`, `uniqueness.py`, `inconsistencies.py`).
- **API Endpoints:** `GET /api/v1/datasets/{id}/quality-audit`.

---

### FEATURE 3: Statistical Outlier Quarantine (IQR & Z-Score)
- **What does it do?** Detects extreme anomalies in numeric columns using two algorithms:
  - **IQR Method:** Values outside $[\text{Q1} - 1.5 \times \text{IQR}, \text{Q3} + 1.5 \times \text{IQR}]$.
  - **Z-Score Method:** Values with $|Z| > 3.0$ where $Z = \frac{x - \mu}{\sigma}$.
- **Why does it exist?** Spikes in fare amounts, transaction volumes, or sensor readings can severely distort machine learning models and aggregate business metrics.
- **Frontend Files:** `frontend/src/app/datasets/[id]/page.tsx` (Tab 3: Statistics, Tab 9: Quality Engine).
- **Backend Files:** `backend/app/quality_engine/outliers.py`.

---

### FEATURE 4: AI Intelligence Layer & Gemini Copilot
- **What does it do?** Leverages Google Gemini 2.0 Flash to generate:
  1. **Executive Summary:** Plain-English summary of what the dataset contains, its domain, and critical observations.
  2. **Data Quality Defects:** Highlighted risk analysis of nulls, duplicates, and schema drift.
  3. **Remediation Playbook:** Step-by-step cleaning recommendations.
  4. **Column Explainer:** Deep dive into the meaning and distributions of any selected column.
- **Why does it exist?** Converts raw numbers into executive-level insights that non-technical stakeholders can understand immediately.
- **Frontend Files:** `frontend/src/app/datasets/[id]/page.tsx` (Tab 6: AI Insights).
- **Backend Files:** `backend/app/ai/service.py`, `backend/app/ai/client.py`.
- **API Endpoints:** `POST /api/v1/datasets/{id}/ai/summary`, `/quality`, `/recommendations`, `/column`.

---

### FEATURE 5: Interactive AI Chat Terminal
- **What does it do?** Multi-turn conversational terminal where users can ask questions about the dataset in plain English (e.g. *"What is the average transaction amount for active users?"*).
- **Frontend Files:** `frontend/src/app/datasets/[id]/page.tsx` (`AIChatSection` inside Tab 6).
- **Backend Files:** `backend/app/ai/service.py` (`chat_with_dataset()`).
- **API Endpoints:** `POST /api/v1/datasets/{id}/ai/chat`.

---

### FEATURE 6: Code Studio (SQL & PySpark Pipeline Generator)
- **What does it do?** Generates production-ready data cleaning and transformation scripts in ANSI SQL, DuckDB, Postgres, and PySpark based on natural language objectives.
- **Frontend Files:** `frontend/src/app/datasets/[id]/page.tsx` (Tab 7: Code Studio).
- **Backend Files:** `backend/app/code_generation/service.py`.
- **API Endpoints:** `POST /api/v1/datasets/{id}/generate/sql`, `POST /api/v1/datasets/{id}/generate/pyspark`.

---

### FEATURE 7: AWS S3, Glue Catalog & Athena Lakehouse
- **What does it do?**
  1. Uploads raw files to AWS S3 (`s3://data-detective-ai-2026/raw/`).
  2. Normalizes column headers and writes curated files to `s3://data-detective-ai-2026/curated/`.
  3. Automatically registers the schema as a table in AWS Glue Data Catalog.
  4. Allows direct execution of Amazon Athena SQL queries with strict scan limits ($100\text{ MB}$).
- **Frontend Files:** `frontend/src/app/datasets/[id]/page.tsx` (Tab 8: AWS Lakehouse).
- **Backend Files:** `backend/app/data_engineering/pipeline.py`, `backend/app/data_engineering/athena_service.py`.
- **API Endpoints:** `GET /api/v1/datasets/{id}/pipeline`, `POST /api/v1/datasets/{id}/pipeline/process`, `POST /api/v1/datasets/{id}/query`.

---

### FEATURE 8: Autonomous AI Analyst (Phase 4)
- **What does it do?** Users ask a high-level business question in plain English $\to$ Gemini generates an Athena SQL query $\to$ Amazon Athena executes the query on AWS S3 $\to$ Gemini reads the result table and generates a complete Root Cause Analysis with strategic recommendations.
- **Frontend Files:** `frontend/src/app/datasets/[id]/page.tsx` (Tab 10: AI Analyst).
- **Backend Files:** `backend/app/ai/analyst_service.py`.
- **API Endpoints:** `POST /api/v1/datasets/{id}/ai/analyst`.
