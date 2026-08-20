# 1. Project Overview — Data Detective AI

---

## What is this project?
**Data Detective AI** is an end-to-end data quality intelligence and autonomous lakehouse platform. It allows data engineers, analysts, and business teams to upload raw data files (CSV, Excel), automatically detects schema types, nulls, outliers, and data inconsistencies, generates production-grade ETL cleaning code, loads curated data into an AWS S3/Glue lakehouse, and provides an Autonomous AI Analyst powered by Google Gemini and Amazon Athena.

---

## What problem does it solve?
In modern companies, data pipelines often break because of "dirty data" (missing values, broken formats, sudden spikes or outliers, and schema drift). 
1. **Manual Profiling is Slow:** Data engineers usually write one-off Pandas or SQL queries to find nulls and invalid values.
2. **Writing Data Quality Rules is Tedious:** Creating cleaning rules, PySpark pipelines, and SQL filters by hand takes hours.
3. **Complex AWS Lakehouse Setup:** Ingesting raw CSVs, converting to curated formats, updating AWS Glue Data Catalog, and querying via Amazon Athena requires deep DevOps and cloud knowledge.
4. **Non-technical Users Cannot Query Lakehouses:** Business stakeholders cannot easily write complex SQL queries to find root causes of data issues.

**Data Detective AI solves all of this automatically in a few clicks.**

---

## Why did we build it?
We built Data Detective AI to bridge the gap between **automated data engineering** and **AI-driven decision making**. Instead of having separate tools for data profiling, AWS ETL pipelines, and AI reporting, this single platform integrates automated statistical audits, cloud lakehouse ingestion, and LLM-powered root-cause reasoning.

---

## Who is the user?
- **Data Engineers:** To instantly audit incoming datasets, detect anomalies, generate PySpark/SQL ETL cleaning pipelines, and manage AWS Glue/Athena tables.
- **Data Analysts / Analytics Engineers:** To explore schema summaries, statistical distributions (IQR, Z-Score), and run natural language queries on AWS Athena without writing raw SQL.
- **Product Managers & Business Stakeholders:** To understand dataset health scores, read AI-generated executive summaries, and inspect data defects in plain English.

---

## What happens when a user opens the project?
1. **Home Landing Page (`/`):** The user sees a modern overview of the platform, active telemetry, and architecture highlights.
2. **Dashboard (`/dashboard`):** Real-time aggregate KPIs show average data quality health, total rows audited, total columns mapped, memory footprint, flagged nulls, duplicates, and outliers across all datasets.
3. **Upload Dataset (`/upload`):** The user drags and drops a CSV or Excel file. The backend verifies file integrity, calculates SHA-256 checksums, and runs automated profiling.
4. **Dataset Dossier (`/datasets/[id]`):** An interactive 10-tab workspace opens:
   - **Tab 1 (Overview):** Overall Quality Health Score (0–100%) and key deductions.
   - **Tab 2 (Columns & Schema):** Inferred data types, null rates, and uniqueness cardinality.
   - **Tab 3 (Statistics):** Numeric field statistics (min, max, mean, stddev, IQR outliers).
   - **Tab 4 (Categories):** Frequency breakdown of text/categorical columns.
   - **Tab 5 (Charts):** Interactive bar and pie charts for completeness and null values.
   - **Tab 6 (AI Insights):** Gemini 2.0 executive summaries, risk reports, cleaning playbooks, and interactive AI chat.
   - **Tab 7 (Code Studio):** Generates production SQL and PySpark cleaning scripts.
   - **Tab 8 (AWS Lakehouse):** Curates data into AWS S3, catalogs in AWS Glue, and executes Amazon Athena queries.
   - **Tab 9 (Quality Engine):** 4-dimension audit (Completeness, Validity, Uniqueness, Consistency).
   - **Tab 10 (AI Analyst):** Asks plain English questions $\to$ generates SQL $\to$ executes Athena $\to$ synthesizes root-cause answers.

---

## What are the major features?
1. **Automated Data Profiler:** Instant type inference (Integer, Float, Date, Boolean, Category, Text), null counts, distinct counts, and RAM footprint calculations.
2. **Multi-Dimensional Quality Engine:** Evaluates dataset health across 4 dimensions: Completeness (30%), Validity (30%), Uniqueness (20%), and Consistency (20%).
3. **Statistical Outlier Detection:** Employs Interquartile Range ($1.5 \times \text{IQR}$) and Z-Score ($Z > 3.0$) algorithms to quarantine numeric anomalies.
4. **AI Intelligence Layer:** Uses Google Gemini 2.0 Flash to synthesize executive summaries, detect schema risks, suggest step-by-step cleaning playbooks, and answer questions in an investigator chat.
5. **Code Studio (ETL Generator):** Automatically writes optimized SQL (ANSI, DuckDB, Postgres) and PySpark cleaning scripts based on natural language objectives.
6. **AWS S3 / Glue / Athena Lakehouse Integration:** Curates uploaded raw files into standardized formats in AWS S3, creates AWS Glue Data Catalog tables, and allows live Athena SQL execution with scan limits.
7. **Autonomous AI Analyst:** Multi-step pipeline: $\text{Natural Language Question} \to \text{Gemini Athena SQL} \to \text{Boto3 Athena Execution} \to \text{Gemini Root Cause Synthesis}$.

---

## What technologies are being used?
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Framer Motion, TanStack React Query.
- **Backend:** Python 3.11+, FastAPI, Uvicorn, Pandas, SQLAlchemy 2.0, Pydantic v2.
- **Database / Metadata Store:** SQLite / PostgreSQL (via SQLAlchemy ORM).
- **AI / LLM:** Google Gemini 2.0 Flash (`google-genai` SDK).
- **Cloud Lakehouse:** AWS S3, AWS Glue Data Catalog, Amazon Athena (`boto3`).
- **Testing:** Pytest (102 unit & integration test suite).

---

## What is the overall architecture?
```
[ User Browser (Next.js 14 / React 18) ]
                     │  (REST API / JSON)
                     ▼
[ FastAPI Backend (Python 3.11+ / Uvicorn) ]
    ├── Data Profiling & Quality Engine (Pandas / NumPy / IQR / Z-Score)
    ├── SQLite / PostgreSQL (Dataset & Profile Metadata)
    ├── Google Gemini 2.0 Flash (AI Summaries, Code Gen, AI Analyst)
    └── AWS Boto3 Services
           ├── AWS S3 (Raw & Curated Storage)
           ├── AWS Glue (Data Catalog & Table Schema)
           └── Amazon Athena (Serverless SQL Query Engine)
```

---

## What is the frontend responsible for?
- Presenting a clean, modern user interface.
- Handling file drag-and-drop uploads (`react-dropzone`).
- Managing data fetching and caching with TanStack React Query.
- Visualizing distributions, completeness ratios, and null values with Recharts.
- Providing 10 dedicated tabs for deep dataset exploration and AI interrogation.

---

## What is the backend responsible for?
- Providing high-speed REST API endpoints under `/api/v1`.
- Parsing, validating, and profiling uploaded datasets using Pandas.
- Calculating statistical quality metrics, anomalies, and health scores.
- Interacting with Google Gemini 2.0 Flash API for AI reasoning.
- Interfacing with AWS S3, AWS Glue, and Amazon Athena via Boto3.
- Persisting dataset records and cached AI responses in the database.

---

## What is the database responsible for?
- Storing dataset metadata (filename, size, storage path, upload status, S3 keys, Glue catalog table).
- Storing calculated profile summaries (total rows, columns, quality score, duplicate count, memory size).
- Caching AI analysis outputs (`ai_insights` table) to avoid redundant LLM calls and reduce API costs.

---

## What external APIs / services are used?
1. **Google Gemini API (`gemini-2.0-flash`):** Used for AI summaries, defect diagnosis, code generation, and analyst reasoning.
2. **AWS S3:** Object storage for raw dataset uploads and curated Parquet/CSV files.
3. **AWS Glue Data Catalog:** Manages table schemas and partitions for serverless queries.
4. **Amazon Athena:** Executes distributed SQL queries directly over S3 bucket data.

---

## What makes this project useful?
It eliminates repetitive data engineering busywork. Instead of writing custom profiling scripts, manually building AWS Athena tables, and guessing why data is broken, Data Detective AI automates the entire ingestion, quality audit, code generation, and AI investigation in seconds.

---

## PROJECT IN ONE MINUTE (60 Seconds Interview Pitch)
> *"Data Detective AI is an autonomous data quality intelligence and lakehouse platform that I built using FastAPI, Next.js 14, and AWS. When a user uploads a raw dataset like CSV or Excel, our backend automatically computes a multi-dimensional quality score, detects IQR and Z-Score outliers, and flags schema inconsistencies. It then automatically syncs the data to AWS S3 and registers it in the AWS Glue Data Catalog.*
> 
> *On top of that, we integrated Google Gemini 2.0 to provide automated root-cause summaries, generate production SQL and PySpark ETL cleaning code, and power an Autonomous AI Analyst. The AI Analyst translates natural language business questions into Amazon Athena SQL, runs the query serverlessly over S3, and synthesizes root-cause business insights. The entire platform is backed by a 102-test pytest suite, SQLAlchemy ORM, and modern Tailwind frontend."*

---

## PROJECT IN 30 SECONDS
> *"Data Detective AI is an automated data quality and AWS Lakehouse platform. It takes raw CSV/Excel files, calculates statistical health scores and outlier boundaries, curates the data into AWS S3 and Glue Catalog, and lets users query Amazon Athena using natural language powered by Google Gemini 2.0 Flash."*
