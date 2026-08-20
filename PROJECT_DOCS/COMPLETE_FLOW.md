# 2. Complete Application Flow — Data Detective AI

---

## 1. High-Level Master Architecture Flow

```
User Action (Upload / Inspect / Query / Ask AI)
                     │
                     ▼
[ Frontend: Next.js 14 / React 18 / TypeScript ]
  • API call via `fetch()` / `@tanstack/react-query`
                     │
                     ▼ (HTTP REST / JSON)
[ Backend: FastAPI (Python 3.11+) ]
  • Route Handler: `app/api/v1/endpoints.py`
  • Core Services: `DatasetProfiler`, `QualityEngine`, `AIService`, `AIAnalystService`, `AthenaService`
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
[ Database: SQLite/Postgres ]  [ Google Gemini 2.0 API ]  [ AWS Cloud (S3/Glue/Athena) ]
  • `Dataset` Table              • `generate_content`        • Boto3 S3 upload
  • `DatasetProfile` Table       • System Instructions       • Boto3 Glue create_table
  • `AIInsight` Table            • JSON Schema Enforcement   • Boto3 Athena run_query
         │           │           │
         └───────────┼───────────┘
                     │
                     ▼
[ Backend Formats Response & Returns JSON ]
                     │
                     ▼
[ Frontend React Query Caches Data & Updates UI ]
```

---

## 2. Detailed Major Flows

---

### FLOW 1: Dataset Upload & Automated Profiling Flow

1. **What starts the flow?**
   User goes to `/upload`, selects or drops a CSV or Excel file (`.csv`, `.xlsx`, `.xls`), and clicks `"Upload & Profile Dataset"`.
2. **Which file handles it on Frontend?**
   `frontend/src/app/upload/page.tsx` (`handleUpload()` function).
3. **What happens on Frontend?**
   - Creates a `FormData` object containing the binary file.
   - Sends an HTTP `POST` request to `http://localhost:8000/api/v1/upload`.
   - Starts a smooth visual progress bar from 15% to 100%.
4. **Which backend endpoint receives it?**
   `POST /api/v1/upload` in `backend/app/api/v1/endpoints.py` (`upload_dataset()` function).
5. **What happens inside Backend?**
   - Validates file size ($\le 50\text{ MB}$) and file extension.
   - Saves file locally to `uploads/` (or S3 if configured) using `StorageService`.
   - Creates a `Dataset` database record with unique UUID.
   - Passes file buffer to `DatasetProfiler.profile_file()`.
   - `DatasetProfiler` loads data into Pandas, detects column data types, computes null rates, min/max/mean/stddev, calculates $1.5 \times \text{IQR}$ and Z-score outliers, and evaluates health score (0–100%).
   - Stores calculated profile in `DatasetProfile` database table.
6. **What response comes back?**
   JSON containing `{ "id": "<uuid>", "original_filename": "...", "storage_type": "LOCAL", "file_size": ..., "health_score": 92 }`.
7. **What does the user finally see?**
   A green success alert appears with a button `"Open Dataset Overview"` linking directly to `/datasets/[id]`.

---

### FLOW 2: Dashboard Overview & Global KPI Aggregation Flow

1. **What starts the flow?**
   User opens `/dashboard` or clicks `"01. Dashboard"` in Navbar.
2. **Which file handles it on Frontend?**
   `frontend/src/app/dashboard/page.tsx`.
3. **Which API is called?**
   `GET /api/v1/datasets` via TanStack React Query (`useQuery(['datasets'])`).
4. **Which backend endpoint receives it?**
   `GET /api/v1/datasets` in `backend/app/api/v1/endpoints.py` (`list_datasets()` function).
5. **What happens inside Backend?**
   - Queries `DatasetRepository.list_all()`.
   - Left-joins with `DatasetProfile` table to fetch each dataset's row count, column count, and health score.
   - Returns a JSON array of `DatasetItem` objects.
6. **What happens on Frontend?**
   - Aggregates total rows, total columns, memory footprint, average quality health score, duplicate count, and outlier counts.
   - Displays real-time KPI tiles, an active datasets table, and the "Platform Feature Guide" directory.

---

### FLOW 3: Multi-Dimensional Quality Audit Flow (Quality Engine)

1. **What starts the flow?**
   User opens `/datasets/[id]` and clicks on tab **`09. Quality Engine`**.
2. **Which file handles it on Frontend?**
   `frontend/src/app/datasets/[id]/page.tsx` (`QualityAuditSection` component).
3. **Which API is called?**
   `GET /api/v1/datasets/{dataset_id}/quality-audit`.
4. **Which backend endpoint receives it?**
   `GET /api/v1/datasets/{dataset_id}/quality-audit` in `backend/app/api/v1/endpoints.py` (`get_quality_audit()` function).
5. **What happens inside Backend?**
   - Retrieves the dataset file path from the database.
   - Reads the dataset into Pandas DataFrame.
   - Invokes `QualityAuditEngine.audit_dataset(df)`:
     - **Completeness Dimension (30% weight):** Audits null and blank cell ratios.
     - **Validity Dimension (30% weight):** Runs regex checks for emails, phone numbers, UUIDs, dates, and negative numbers in positive fields.
     - **Uniqueness Dimension (20% weight):** Identifies exact duplicate rows and primary key collisions.
     - **Consistency Dimension (20% weight):** Flags leading/trailing whitespace, mixed letter casing, and delimiter inconsistencies.
     - **Outlier Engine:** Calculates IQR and Z-Score outlier lists.
   - Computes weighted overall score:
     $$\text{Overall Score} = (0.30 \times \text{Comp}) + (0.30 \times \text{Val}) + (0.20 \times \text{Uniq}) + (0.20 \times \text{Cons})$$
6. **What does the user finally see?**
   Interactive scorecards for each dimension, severity badges, and an actionable anomaly register table.

---

### FLOW 4: AI Intelligence & Gemini Copilot Flow

1. **What starts the flow?**
   User clicks on tab **`06. AI Insights`** and switches between `Executive Summary`, `Quality Defects`, `Remediation Playbook`, `Column Explainer`, or `AI Chat Terminal`.
2. **Which backend endpoints handle it?**
   - `POST /api/v1/datasets/{dataset_id}/ai/summary`
   - `POST /api/v1/datasets/{dataset_id}/ai/quality`
   - `POST /api/v1/datasets/{dataset_id}/ai/recommendations`
   - `POST /api/v1/datasets/{dataset_id}/ai/column`
   - `POST /api/v1/datasets/{dataset_id}/ai/chat`
3. **What happens inside Backend (`app/ai/service.py`)?**
   - Checks if a cached result already exists in the `ai_insights` database table (for summary/quality/recommendations).
   - If not cached, formats dataset profile metrics into a structured prompt.
   - Calls Google Gemini 2.0 Flash (`get_gemini_client()`).
   - Parses the JSON response from Gemini, caches it in `ai_insights`, and returns it to the client.
4. **What happens in AI Chat Terminal?**
   - User types a natural language question (e.g., *"Why is the health score low?"*).
   - Backend sends user message + last 10 chat history items + dataset schema context to Gemini.
   - Gemini responds conversationally with data insights.

---

### FLOW 5: Code Studio (SQL & PySpark Generator) Flow

1. **What starts the flow?**
   User clicks on tab **`07. Code Studio`**, types a transformation objective (or clicks a preset chip), and clicks `"Generate Code"`.
2. **Which API is called?**
   - For SQL: `POST /api/v1/datasets/{dataset_id}/generate/sql`
   - For PySpark: `POST /api/v1/datasets/{dataset_id}/generate/pyspark`
3. **What happens inside Backend (`app/code_generation/service.py`)?**
   - Builds a prompt containing the dataset schema, column types, and user instruction.
   - Calls Gemini with strict code-generation guidelines.
   - Extracts generated SQL/PySpark code, explanation, and dialect.
4. **What does the user see?**
   Syntax-highlighted code editor with a `"Copy Code"` and `"Download Script"` button.

---

### FLOW 6: AWS Lakehouse (S3 + Glue + Athena) Flow

1. **What starts the flow?**
   User clicks on tab **`08. AWS Lakehouse`** and clicks `"Process to Lakehouse"`.
2. **Which API is called?**
   `POST /api/v1/datasets/{dataset_id}/pipeline/process`.
3. **What happens inside Backend (`app/data_engineering/pipeline.py`)?**
   - **Step 1 (Raw Ingestion):** Uploads raw CSV to `s3://data-detective-ai-2026/raw/`.
   - **Step 2 (Normalization & Parquet Curation):** Normalizes column names (snake_case), cleans headers, and saves curated file to `s3://data-detective-ai-2026/curated/`.
   - **Step 3 (Cataloging):** Calls AWS Glue Data Catalog (`create_table` / `update_table`) to register table schema in database `data_detective`.
   - **Step 4 (Athena Querying):** Allows user to submit ANSI SQL queries via `POST /api/v1/datasets/{dataset_id}/query`.
   - Boto3 Athena client executes query under workgroup `data-detective` (enforcing a 100MB scan limit).
4. **What does the user see?**
   Live query execution status, elapsed milliseconds, megabytes scanned, and result data table.

---

### FLOW 7: Autonomous AI Analyst Flow (Phase 4)

1. **What starts the flow?**
   User clicks on tab **`10. AI Analyst`**, types a business question (e.g. *"Show top 5 records by fare amount with their vendor names"*), and clicks `"Run Autonomous Investigation"`.
2. **Which API is called?**
   `POST /api/v1/datasets/{dataset_id}/ai/analyst`.
3. **What happens inside Backend (`app/ai/analyst_service.py`)?**
   - **Step A:** Gemini analyzes question and table schema, then generates a safe, read-only Athena SQL `SELECT` query.
   - **Step B:** `AthenaService` executes generated SQL against Amazon Athena.
   - **Step C:** If query succeeds, Athena returns row records + telemetry (execution time ms, MB scanned).
   - **Step D:** Gemini reviews the query results + original question and writes a Root Cause Synthesis & Business Recommendation.
4. **What does the user see?**
   - AI Thought & Generated SQL box.
   - Live Amazon Athena Telemetry chips (Duration, Data Scanned).
   - Query Result Data Grid.
   - AI Root Cause Synthesis card.
