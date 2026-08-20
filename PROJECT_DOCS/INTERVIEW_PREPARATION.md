# 9. Interview Preparation Guide — Data Detective AI

---

## Part 1: Core Interview Questions & Natural Spoken Answers

### A. "Tell me about your project"
> *"I built **Data Detective AI**, an autonomous data quality intelligence and lakehouse platform. The core problem it solves is that in data engineering, incoming raw datasets frequently have hidden defects—like null values, invalid formats, duplicate rows, and statistical outliers—that break production ETL pipelines.*
> 
> *With our platform, a data engineer simply uploads a raw CSV or Excel file. The backend automatically infers data types, calculates statistical bounds using IQR and Z-Scores, and scores dataset health across four dimensions: Completeness, Validity, Uniqueness, and Consistency.*
> 
> *It also syncs the data into an AWS Lakehouse (S3 and Glue Catalog) and integrates Google Gemini 2.0 to provide automated root-cause summaries, generate PySpark/SQL ETL cleaning code, and power an Autonomous AI Analyst that can answer business questions by writing and executing live Amazon Athena SQL queries."*

---

### B. "Why did you build this?"
> *"I noticed that data engineers and analysts spend almost 80% of their time on mundane data cleaning, writing repetitive Pandas profiling scripts, and manually setting up cloud lakehouses. I wanted to build a unified system that automates the whole lifecycle—from raw file ingestion to statistical quality scoring, cloud cataloging, and natural-language AI investigations."*

---

### C. "What problem does it solve?"
> *"It eliminates dirty data before it corrupts production data warehouses and machine learning models. Instead of manually inspecting thousands of rows, the platform flags every single outlier, invalid format, and null cell in seconds, and automatically writes the exact SQL or PySpark code needed to clean it."*

---

### D. "How does your project work?"
> *"Basically, the frontend is built with Next.js 14 and Tailwind CSS, and the backend is powered by FastAPI. When a file is uploaded, FastAPI streams it to our profiler engine, which uses Pandas to calculate stats, data types, and outlier boundaries. The metadata is saved in SQLite/Postgres using SQLAlchemy.*
> 
> *For cloud operations, we use Boto3 to upload the data to AWS S3, register the table schema in AWS Glue Data Catalog, and query it via Amazon Athena. When the user asks a question, Google Gemini 2.0 generates an Athena SQL query, executes it over S3, and returns a root-cause explanation to the user."*

---

### E. "What is your tech stack and why?"
> *"For the frontend, I used **Next.js 14, React 18, TypeScript, and Tailwind CSS** for fast page loads and type safety. I used **TanStack React Query** for automated API caching and **Recharts** for visual data graphs.*
> 
> *For the backend, I picked **FastAPI and Python** because FastAPI is high-performance, asynchronous, and provides built-in Pydantic schema validation. We used **Pandas** for in-memory data processing, **SQLAlchemy** for database ORM, **Google Gemini 2.0 Flash** for fast AI reasoning, and **AWS S3, Glue, and Athena** for serverless lakehouse queries."*

---

### F. "Explain the architecture"
> *"It follows a 3-tier modular architecture:*
> 1. *Client Layer: Next.js Single Page Application communicating via REST APIs.*
> 2. *Application Layer: FastAPI backend split into specialized services—Data Profiler, Quality Engine, AI Service, Code Generator, and AWS Pipeline Service.*
> 3. *Data & Cloud Layer: Relational metadata stored in SQLite/Postgres, raw/curated data stored in AWS S3, metadata cataloged in AWS Glue, and queries executed serverlessly on Amazon Athena."*

---

### G. "Explain the complete flow"
> *"When a user uploads a CSV, the frontend sends a multipart request to `POST /api/v1/upload`. The backend saves the file, runs our `DatasetProfiler` to compute column types, null counts, and IQR outliers, and stores the profile in the database. The user is redirected to the 10-tab dataset dossier.*
> 
> *From there, the user can inspect statistics, view AI-generated summaries from Gemini, click 'Process to Lakehouse' to upload curated data to AWS S3 and Glue Catalog, or use the AI Analyst tab to ask questions that execute live Athena SQL queries."*

---

### H. "What was the most difficult part?"
> *"One of the most challenging parts was building the **Autonomous AI Analyst** pipeline. We had to ensure that when Gemini generated SQL queries from user questions, the queries were strictly safe (blocking any DDL/DML like `DROP` or `DELETE`), accurately matched the exact Glue table schema and column types, and executed within Amazon Athena scan limits (under 100MB) without timing out or failing on partition boundaries."*

---

### I. "What did you personally implement?"
> *"I implemented the backend FastAPI routes, the Pandas statistical profiling engine with IQR and Z-Score outlier detection, the 4-dimension data quality scoring algorithms, the AWS Boto3 integration for S3/Glue/Athena, the Google Gemini prompt engineering and caching layer in `app/ai/`, and the Next.js frontend pages with Recharts and React Query."*

---

### J. "What would you improve?"
> *"In the future, I would:
> 1. Add streaming / chunked file processing using DuckDB or Apache Arrow for files larger than 1GB that exceed server RAM.
> 2. Implement automated CI/CD data quality alerts that send Slack or webhook notifications when a dataset's health score drops below 80%.
> 3. Add user authentication with JWT and multi-tenant role-based access control."*

---

### K. "Why did you choose Google Gemini 2.0 Flash?"
> *"Gemini 2.0 Flash offers extremely low latency (under 1-2 seconds per request), has a massive context window capable of ingesting full dataset schemas and column summaries, and is very cost-effective for high-frequency queries like live SQL generation and AI chat."*

---

### L. "What happens if external services (Gemini or AWS) fail?"
> *"The backend is designed with graceful fallbacks. If the Gemini API is unreachable or the API key is missing, all core profiling, IQR outlier detection, and local statistical audits still work 100% normally. The API returns clear HTTP 503 error messages without crashing the server. Similarly, if AWS credentials are not configured, the platform defaults to local storage mode."*

---

### M. "How would you scale this project?"
> *"To scale this for enterprise production:
> 1. Use an asynchronous task queue like Celery with Redis for heavy background profiling jobs.
> 2. Swap SQLite with Amazon RDS PostgreSQL.
> 3. Process large multi-gigabyte files directly in AWS EMR or AWS Glue PySpark jobs rather than in-memory Pandas.
> 4. Containerize the backend with Docker and deploy on AWS ECS Fargate behind an Application Load Balancer."*

---

### N. "What security concerns exist?"
> *"1. File Upload Security: We validate file size ($\le 50\text{ MB}$) and restrict allowed file extensions (`.csv`, `.xlsx`, `.xls`) to prevent malicious executable uploads.
> 2. SQL Injection / Destructive Query Prevention: The AI Analyst validates all generated SQL queries with a strict regex parser, rejecting any destructive statements (`DROP`, `DELETE`, `TRUNCATE`, `ALTER`, `INSERT`, `UPDATE`).
> 3. Athena Cost Control: We enforce a 100MB per-query scan limit under the `data-detective` Athena workgroup to prevent runaway cloud bills."*

---

## Part 2: 30 Categorized Interview Questions & Answers

---

### LEVEL 1 — Basic Questions (General Knowledge)

#### Q1: What is the difference between Data Profiling and Data Quality Auditing?
- **Interviewer is testing:** Fundamental understanding of data engineering terminology.
- **Simple Answer:** Data profiling is exploratory (discovering column types, null counts, min/max, and quartiles). Data quality auditing is rule-based and evaluative (checking whether the data meets business standards like valid email formats, unique keys, and acceptable outlier thresholds).
- **Why this is correct:** `DatasetProfiler` computes distributions, whereas `QualityAuditEngine` grades data against completeness, validity, uniqueness, and consistency rules.

#### Q2: What is an IQR and how does your project use it?
- **Interviewer is testing:** Basic statistical knowledge.
- **Simple Answer:** IQR (Interquartile Range) is the difference between the 75th percentile ($Q_3$) and the 25th percentile ($Q_1$). We flag any data point below $Q_1 - 1.5 \times \text{IQR}$ or above $Q_3 + 1.5 \times \text{IQR}$ as a statistical outlier.
- **Relevant File:** `backend/app/quality_engine/outliers.py`.

#### Q3: Why is Next.js App Router used instead of traditional React CRA?
- **Interviewer is testing:** Modern frontend architecture knowledge.
- **Simple Answer:** Next.js App Router provides built-in file-based routing, nested layouts (`layout.tsx`), and superior performance without requiring third-party routing libraries like React Router.

#### Q4: What is the purpose of the `ai_insights` table in your database?
- **Interviewer is testing:** Caching and cost optimization awareness.
- **Simple Answer:** It stores AI-generated summaries and playbooks so that when a user revisits a dataset, we retrieve the cached result from the database instead of making a duplicate, paid API call to Google Gemini.
- **Relevant File:** `backend/app/models/ai_insight.py`.

#### Q5: What formats does your upload endpoint support?
- **Interviewer is testing:** Familiarity with supported intake formats.
- **Simple Answer:** It supports `.csv`, `.xlsx` (Excel), and `.xls` files up to a 50MB size limit.

---

### LEVEL 2 — Technical Questions (Implementation Details)

#### Q6: How does your backend infer data types from a raw CSV?
- **Interviewer is testing:** Practical data manipulation in Pandas.
- **Simple Answer:** We inspect non-null sample values. We test for booleans first, then check if numeric values have zero decimal remainders (Integer vs Float). For text columns, we attempt date coercion using `pd.to_datetime`. If $\ge 80\%$ match, we classify as Date. If unique cardinality is low ($<50$), we classify as Category; otherwise, Text.
- **Relevant File:** `backend/app/profiling/profiler.py` (`_infer_data_type`).

#### Q7: How do you prevent hydration errors between Next.js server and client?
- **Interviewer is testing:** Next.js / React 18 hydration mechanics.
- **Simple Answer:** Hydration mismatches happen when server-rendered HTML (e.g. server timestamp) differs from the client browser time. We solved this by adding `suppressHydrationWarning` on `<html>` and formatting date strings only after component mount using an `isMounted` state flag.
- **Relevant File:** `frontend/src/app/layout.tsx`.

#### Q8: How is the overall Quality Health Score calculated?
- **Interviewer is testing:** Understanding of your scoring formula.
- **Simple Answer:** We use a weighted sum of 4 dimensions: Completeness (30%), Validity (30%), Uniqueness (20%), and Consistency (20%). Each dimension is scored from 0 to 100 based on error percentages.
- **Relevant File:** `backend/app/quality_engine/engine.py`.

#### Q9: How does your Athena query service prevent expensive full-table scans?
- **Interviewer is testing:** AWS cost optimization practices.
- **Simple Answer:** We execute all queries under the custom `data-detective` Athena workgroup, which is configured with a 100MB scan limit per query. If a query attempts to scan more data, Athena automatically cancels it.
- **Relevant File:** `backend/app/data_engineering/athena_service.py`.

#### Q10: How does TanStack React Query improve frontend performance?
- **Interviewer is testing:** Frontend state management and caching.
- **Simple Answer:** React Query caches API responses in memory under unique query keys (e.g., `['datasets']`). When navigating between pages, cached data renders immediately while refetching in the background.

---

### LEVEL 3 — Deep Questions (System Understanding)

#### Q11: Trace the exact execution path when a user submits a natural language question in the AI Analyst tab.
- **Interviewer is testing:** Deep end-to-end codebase tracing.
- **Simple Answer:**
  1. Frontend calls `POST /api/v1/datasets/{id}/ai/analyst`.
  2. `AIAnalystService.investigate()` retrieves the dataset schema.
  3. Gemini generates an ANSI SQL `SELECT` query.
  4. Backend runs `_validate_sql_safety()` to ensure no DDL/DML keywords exist.
  5. `AthenaService.run_query()` sends the query to Amazon Athena via Boto3 and polls execution status.
  6. Athena returns row records and execution telemetry (time in ms, MB scanned).
  7. Gemini analyzes the query results and writes a Root Cause Synthesis.
  8. JSON response is rendered in `AIAnalystSection` on the frontend.
- **Relevant File:** `backend/app/ai/analyst_service.py`.

#### Q12: Why do you use SQLAlchemy's Repository Pattern instead of querying inside route handlers?
- **Interviewer is testing:** Software design patterns and clean architecture.
- **Simple Answer:** The Repository Pattern separates database queries from business logic. This makes unit testing easy (we can mock repository methods without needing a live database) and ensures API endpoints remain lean.

#### Q13: What happens when a numeric column has a standard deviation of zero during Z-score calculation?
- **Interviewer is testing:** Edge case handling in mathematical algorithms.
- **Simple Answer:** If $\sigma = 0$ (meaning all values are identical), dividing by $\sigma$ produces a division-by-zero error. Our code checks if $\sigma == 0$ and immediately returns 0 outliers with empty lists.
- **Relevant File:** `backend/app/quality_engine/outliers.py`.

#### Q14: How does your AWS Lakehouse pipeline handle column names with spaces and special characters?
- **Interviewer is testing:** Data curation and Glue schema normalization.
- **Simple Answer:** AWS Glue and Athena reject column names with spaces or uppercase letters. Our normalization function converts all column headers to lowercase `snake_case` and strips non-alphanumeric characters before writing the curated file to S3.
- **Relevant File:** `backend/app/data_engineering/pipeline.py`.

---

### LEVEL 4 — Tricky Questions (Testing Real Understanding vs Memorization)

#### Q15: Why didn't you use PySpark for the local data profiling in FastAPI?
- **Interviewer is testing:** Pragmatic engineering trade-offs.
- **Simple Answer:** Running a PySpark JVM session inside a lightweight FastAPI container introduces massive memory overhead (over 1GB RAM) and 5-10 second JVM startup latency. For uploaded files up to 50MB, Pandas is in-memory, zero-overhead, and completes profiling in under 200 milliseconds. PySpark code generation is provided in Code Studio for when data scales to clusters.

#### Q16: If Gemini generates a `SELECT * FROM table WHERE 1=1; DROP TABLE users;`, will your system execute it?
- **Interviewer is testing:** Security validation mechanisms.
- **Simple Answer:** No. Our `_validate_sql_safety()` function strips comments and checks for semicolon-separated multi-statement queries and forbidden keywords (`DROP`, `DELETE`, `ALTER`). It throws an `UnsafeSQLException` (HTTP 400) before Boto3 is ever called.
- **Relevant File:** `backend/app/ai/analyst_service.py`.

#### Q17: If two users upload files with the exact same name `data.csv` at the same time, what happens?
- **Interviewer is testing:** Concurrency and collision handling.
- **Simple Answer:** The backend generates a unique UUID for every dataset and saves it to disk/S3 as `<uuid>.csv` (`stored_filename`), while preserving `original_filename` only as user-facing metadata. There is zero file collision.
- **Relevant File:** `backend/app/models/dataset.py`.

#### Q18: What is the primary difference between your Z-Score outlier test and your IQR outlier test?
- **Interviewer is testing:** Practical statistics in real-world data.
- **Simple Answer:** Z-Score assumes a normal (Gaussian) distribution and is sensitive to extreme values because mean and standard deviation are affected by outliers. IQR is non-parametric (based on medians and percentiles), making it robust for skewed distributions like income or transaction amounts.
