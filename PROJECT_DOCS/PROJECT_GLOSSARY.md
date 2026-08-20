# 10. Project Glossary — Data Detective AI

---

## Technical Terms & Concepts

### 1. Data Profiling
- **Simple Meaning:** Scanning a raw dataset to understand its shape, columns, data types, null rates, and statistical distributions.
- **How it is used in OUR project:** Handled by `DatasetProfiler` in `backend/app/profiling/profiler.py` immediately when a file is uploaded.

### 2. Data Quality (DQ) Score
- **Simple Meaning:** A numeric rating (from 0% to 100%) indicating how clean, complete, and reliable a dataset is.
- **How it is used in OUR project:** Computed by `QualityAuditEngine` using a weighted sum of Completeness (30%), Validity (30%), Uniqueness (20%), and Consistency (20%).

### 3. Interquartile Range (IQR)
- **Simple Meaning:** The statistical distance between the 25th percentile ($Q_1$) and 75th percentile ($Q_3$).
- **How it is used in OUR project:** Values lower than $Q_1 - 1.5 \times \text{IQR}$ or higher than $Q_3 + 1.5 \times \text{IQR}$ are quarantined as outliers in `backend/app/quality_engine/outliers.py`.

### 4. Z-Score (Standard Score)
- **Simple Meaning:** How many standard deviations a data point is away from the average mean.
- **How it is used in OUR project:** Data points with $|Z| > 3.0$ are flagged as extreme anomalies in numeric columns.

### 5. AWS Lakehouse
- **Simple Meaning:** A modern cloud data architecture that combines the cost-effective storage of an S3 Data Lake with the querying power of a Data Warehouse.
- **How it is used in OUR project:** Raw files are uploaded to AWS S3, metadata is registered in AWS Glue Data Catalog, and queries are executed serverlessly via Amazon Athena.

### 6. AWS Glue Data Catalog
- **Simple Meaning:** A central schema dictionary that tells cloud query engines what tables, columns, and data types exist in S3.
- **How it is used in OUR project:** `backend/app/data_engineering/pipeline.py` creates table definitions in the `data_detective` Glue database.

### 7. Amazon Athena
- **Simple Meaning:** A serverless, interactive query service that lets you run standard ANSI SQL directly against files in AWS S3 without spinning up databases.
- **How it is used in OUR project:** `AthenaService` executes SQL queries and powers our Phase 4 Autonomous AI Analyst.

### 8. Google Gemini 2.0 Flash
- **Simple Meaning:** Google's latest multimodal Large Language Model (LLM) optimized for ultra-low latency and complex reasoning.
- **How it is used in OUR project:** Generates plain-English executive summaries, risk reports, SQL/PySpark ETL code, and root-cause business synthesis.

### 9. FastAPI
- **Simple Meaning:** A high-speed, modern Python web framework for building REST APIs with automatic schema validation and documentation.
- **How it is used in OUR project:** Runs our backend API server at port 8000, handling all file uploads, AI generation, and database interactions.

### 10. Next.js App Router
- **Simple Meaning:** A React framework that uses folder-based routing and server/client component rendering.
- **How it is used in OUR project:** Powers our frontend web app at port 3000 (`/dashboard`, `/upload`, `/datasets`, `/settings`).

### 11. TanStack React Query
- **Simple Meaning:** A frontend data-fetching and caching library that keeps client UI automatically synchronized with backend API responses.
- **How it is used in OUR project:** Caches dataset lists, profile trees, and pipeline statuses to prevent redundant API calls.

### 12. SQLAlchemy ORM & Repository Pattern
- **Simple Meaning:** A Python library that maps database tables to Python classes, coupled with a design pattern that isolates database queries into repository classes.
- **How it is used in OUR project:** Located in `backend/app/repositories/`, managing CRUD operations for `Dataset`, `DatasetProfile`, and `AIInsight` models.
