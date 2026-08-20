# 3. Folder and File Guide — Data Detective AI

---

## 1. Project Directory Structure Overview

```
data detective/
├── backend/                  # FastAPI Python backend service
│   ├── app/                  # Application core modules
│   │   ├── ai/               # Gemini AI Intelligence & Autonomous Analyst
│   │   ├── api/              # REST API route handlers
│   │   ├── code_generation/  # SQL & PySpark code generator service
│   │   ├── core/             # Settings, configurations, custom exceptions
│   │   ├── data_engineering/ # AWS S3, Glue, and Athena lakehouse pipeline
│   │   ├── database/         # Database engine, session, and base models
│   │   ├── models/           # SQLAlchemy database entity models
│   │   ├── profiling/        # Statistical data profiler & type inference
│   │   ├── quality_engine/   # 4-dimension quality audit & outlier detection
│   │   ├── repositories/     # Data Access Layer (CRUD queries)
│   │   ├── schemas/          # Pydantic request/response validation models
│   │   └── services/         # Storage and file management services
│   │   └── main.py           # FastAPI entrypoint application
│   ├── tests/                # Complete Pytest test suite (102 unit tests)
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Backend container configuration
├── frontend/                 # Next.js 14 Web Application
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   │   ├── dashboard/    # Dashboard Overview & KPI cards
│   │   │   ├── datasets/     # Dataset Catalog & 10-Tab Dataset Dossier
│   │   │   ├── upload/       # Drag-and-drop dataset upload page
│   │   │   ├── settings/     # User profile, API keys, and AWS config
│   │   │   ├── layout.tsx    # Root layout with navbar and status header
│   │   │   └── globals.css   # Tailored luxury Camel & Blush Pink styling
│   │   └── components/       # Shared UI components & charts
│   ├── package.json          # Node dependencies
│   └── tailwind.config.ts    # Custom color tokens and font families
├── PROJECT_DOCS/             # Comprehensive documentation & interview prep
└── docker-compose.yml        # Multi-container orchestration
```

---

## 2. Backend Folder & File Details

### `backend/app/main.py`
- **Purpose:** The central entry point for the FastAPI application.
- **Responsibilities:**
  - Initializes the FastAPI app instance with metadata and CORS middleware.
  - Automatically creates database tables on startup using SQLAlchemy `Base.metadata.create_all(bind=engine)`.
  - Mounts the versioned API router (`app.include_router(api_router, prefix=settings.API_V1_STR)`).
  - Configures global exception handlers for graceful error responses.

---

### `backend/app/api/v1/endpoints.py`
- **Purpose:** Defines all REST API endpoints for the platform.
- **Used by:** The Next.js frontend to execute uploads, audits, queries, and AI tasks.
- **Key Functions:**
  - `upload_dataset()`: Handles multipart file uploads, calls profiler, and saves dataset record.
  - `list_datasets()`: Returns all datasets with profile metrics for the dashboard.
  - `get_dataset_profile()`: Returns detailed column statistics and health score for a dataset.
  - `get_quality_audit()`: Executes 4-dimension data quality audit (Completeness, Validity, Uniqueness, Consistency).
  - `trigger_lakehouse_pipeline()`: Orchestrates S3 curation and AWS Glue Catalog registration.
  - `execute_athena_query()`: Runs read-only Athena SQL queries against Lakehouse tables.
  - `generate_ai_summary()` / `generate_ai_quality()` / `generate_ai_recommendations()`: Calls Gemini for executive summaries and playbooks.
  - `ai_chat()`: Handles multi-turn conversational chat with dataset context.
  - `generate_sql()` / `generate_pyspark()`: Generates ETL cleaning code via Gemini.
  - `run_ai_analyst()`: Phase 4 Autonomous Analyst (Natural language $\to$ Athena SQL $\to$ Root Cause).

---

### `backend/app/profiling/profiler.py`
- **Purpose:** Core engine that analyzes raw CSV/Excel files using Pandas.
- **Key Functions:**
  - `profile_file()`: Reads file, detects delimiter/encoding, validates headers, and orchestrates profiling.
  - `_infer_data_type()`: Robustly identifies if a column is Integer, Float, Date, Boolean, Category, or Text.
  - `_calculate_numeric_stats()`: Computes min, max, mean, stddev, quartiles (Q1, Q2, Q3), and IQR.
  - `_calculate_health_score()`: Calculates a 0–100% health score based on null rates, duplicates, and outliers.

---

### `backend/app/quality_engine/`
- **Purpose:** Implements multi-dimensional data quality auditing and statistical outlier quarantine.
- **Key Files:**
  - `engine.py` (`QualityAuditEngine`): Aggregates scores across 4 dimensions.
  - `completeness.py`: Audits null, NaN, and whitespace-empty cell ratios.
  - `validity.py`: Runs regex pattern validators for email, phone, dates, UUIDs, and value ranges.
  - `uniqueness.py`: Detects duplicate row signatures and column key collisions.
  - `inconsistencies.py`: Flags leading/trailing whitespace, mixed casing, and format drift.
  - `outliers.py`: Calculates IQR ($1.5 \times \text{IQR}$) and Z-Score ($Z > 3.0$) outlier lists.

---

### `backend/app/ai/`
- **Purpose:** Handles all interactions with Google Gemini 2.0 Flash LLM.
- **Key Files:**
  - `client.py` (`get_gemini_client()`): Creates and caches the Google GenAI SDK client using `GEMINI_API_KEY`.
  - `service.py` (`AIService`): Provides structured prompts for summaries, risk reports, cleaning playbooks, column explanations, and chat.
  - `analyst_service.py` (`AIAnalystService`): Powers the Phase 4 Autonomous AI Analyst by generating Athena SQL, executing queries via `AthenaService`, and synthesizing root causes.
  - `schemas.py`: Pydantic data schemas for AI requests and structured JSON responses.

---

### `backend/app/data_engineering/`
- **Purpose:** Manages AWS S3 storage, Glue Data Catalog, and Amazon Athena integration.
- **Key Files:**
  - `pipeline.py` (`DataLakehousePipeline`): Orchestrates raw $\to$ curated transformation, S3 upload, and Glue table creation.
  - `athena_service.py` (`AthenaService`): Executes distributed queries on Amazon Athena with workgroup scan limits and handles polling/results parsing.
  - `schema_converter.py`: Translates Pandas/inferred data types to AWS Glue / Athena data types (`bigint`, `double`, `string`, `timestamp`, `boolean`).

---

### `backend/app/models/`
- **Purpose:** SQLAlchemy database entity definitions.
- **Key Files:**
  - `dataset.py` (`Dataset`): Stores file metadata, storage location, pipeline status, and Glue table references.
  - `profile.py` (`DatasetProfile`): Stores row counts, column counts, health score, and serialized JSON profile data.
  - `ai_insight.py` (`AIInsight`): Stores cached AI summaries and playbooks to minimize LLM token costs.

---

### `backend/app/repositories/`
- **Purpose:** Data Access Layer (Repository Pattern) isolating database queries from API controllers.
- **Key Files:**
  - `dataset_repo.py` (`DatasetRepository`): CRUD operations for datasets.
  - `profile_repo.py` (`DatasetProfileRepository`): CRUD operations for profiles.
  - `ai_insight_repo.py` (`AIInsightRepository`): Lookup and cache updates for AI insights.

---

## 3. Frontend Folder & File Details

### `frontend/src/app/layout.tsx`
- **Purpose:** Root HTML layout wrapper for the entire application.
- **Responsibilities:**
  - Injects Google fonts (Space Grotesk, JetBrains Mono, Plus Jakarta Sans).
  - Includes `suppressHydrationWarning` to eliminate client/server timestamp hydration errors.
  - Renders top engine status banner, sticky `Navbar`, and global footer.
  - Wraps application inside `QueryProvider` (TanStack React Query).

---

### `frontend/src/app/globals.css` & `frontend/tailwind.config.ts`
- **Purpose:** Defines the unique **Desert Camel & Velvet Blush Pink Luxury Theme**.
- **Key Design Tokens:**
  - Background: `#141013` (Deep Velvet Espresso Charcoal).
  - Surface Cards: `#1F181D` (Warm Velvet Slate) with `#382A34` borders.
  - Primary Accents: `#C89D66` (Warm Desert Camel Gold).
  - AI Accents: `#E08D9D` (Velvet Blush Rose Pink).
  - Badges: Emerald (`#5FA788`), Crimson (`#D96B60`), Amber (`#C89D66`).

---

### `frontend/src/components/Navbar.tsx`
- **Purpose:** Top navigation bar with frosted-glass styling and route links.
- **Links:**
  - `01. Dashboard` (`/dashboard`)
  - `02. Upload Data` (`/upload`)
  - `03. Datasets` (`/datasets`)
  - `04. Settings` (`/settings`)
  - Primary button: `"Upload Dataset"`.

---

### `frontend/src/app/dashboard/page.tsx`
- **Purpose:** Executive dashboard displaying aggregate data quality metrics across all uploaded files.
- **Key Features:**
  - KPI tiles: Quality Health %, Total Rows, Total Columns, Memory Usage, Flagged Nulls, Duplicates, Outliers.
  - Active Datasets Table with quick "Inspect" buttons.
  - Platform Feature Guide column explaining all 6 major platform tools.

---

### `frontend/src/app/upload/page.tsx`
- **Purpose:** Drag-and-drop file ingestion interface.
- **Key Features:**
  - File dropzone supporting `.csv`, `.xlsx`, `.xls` files up to 50MB.
  - Animated progress bar during processing.
  - Instant navigation link to inspect the dataset once profiling completes.

---

### `frontend/src/app/datasets/page.tsx`
- **Purpose:** Dataset catalog and explorer.
- **Key Features:**
  - Card grid of all uploaded datasets showing file size, extension, storage type (LOCAL / S3), and timestamp.
  - Direct "Inspect" action buttons to open the dataset dossier.

---

### `frontend/src/app/datasets/[id]/page.tsx`
- **Purpose:** Comprehensive 10-tab dataset analytics workspace.
- **Tabs Explained:**
  1. `01. Overview`: Quality health score dial (0–100%) and deduction checklist.
  2. `02. Columns & Schema`: Column table with inferred data types and null counts.
  3. `03. Statistics`: Numeric field statistical moments (min, max, mean, stddev, quartiles).
  4. `04. Categories`: Frequency breakdown of distinct categorical text fields.
  5. `05. Charts`: Visual Recharts bar and pie charts for nulls and completeness.
  6. `06. AI Insights`: Subtabs for Executive Summary, Defects, Playbook, Column Explainer, and Chat.
  7. `07. Code Studio`: Interactive SQL (DuckDB/Postgres) and PySpark cleaning code generator.
  8. `08. AWS Lakehouse`: S3 storage keys, Glue Catalog registration, and Athena SQL console.
  9. `09. Quality Engine`: 4-dimension audit cards (Completeness, Validity, Uniqueness, Consistency).
  10. `10. AI Analyst`: Autonomous English-to-Athena SQL investigation and root-cause synthesis.

---

### `frontend/src/components/ProfilerCharts.tsx`
- **Purpose:** Recharts data visualization components tailored with Camel and Rose luxury theme colors.
- **Charts:**
  - `MissingValuesChart`: Bar chart of null cells per column.
  - `DataTypeDistributionChart`: Donut pie chart of detected data types.
  - `ColumnCompletenessChart`: Bar chart of column completeness percentages ($0–100\%$).
  - `CategoryDistributionChart`: Frequency bar chart of top categorical values.
