# 5. API and Data Flow Guide — Data Detective AI

---

## 1. REST API Endpoints Overview

All backend endpoints are prefixed with `/api/v1`.

| Method | Endpoint | Purpose | Caller / Page |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service health status check | System Health Monitor |
| `POST` | `/api/v1/upload` | Upload & auto-profile CSV/Excel file | `/upload` page |
| `GET` | `/api/v1/datasets` | List all datasets with summary metrics | `/dashboard`, `/datasets` |
| `GET` | `/api/v1/datasets/{id}/profile` | Get full statistical profile of a dataset | `/datasets/[id]` (Tabs 1–5) |
| `GET` | `/api/v1/datasets/{id}/quality-audit`| Run 4-dimension quality audit & outlier scan | `/datasets/[id]` (Tab 9) |
| `GET` | `/api/v1/datasets/{id}/pipeline` | Get AWS Lakehouse pipeline status | `/datasets/[id]` (Tab 8) |
| `POST` | `/api/v1/datasets/{id}/pipeline/process` | Trigger S3 curation & AWS Glue table creation | `/datasets/[id]` (Tab 8) |
| `POST` | `/api/v1/datasets/{id}/query` | Execute Athena SQL query against Lakehouse | `/datasets/[id]` (Tab 8) |
| `POST` | `/api/v1/datasets/{id}/ai/summary` | Generate/retrieve AI executive summary | `/datasets/[id]` (Tab 6 - Summary) |
| `POST` | `/api/v1/datasets/{id}/ai/quality` | Generate/retrieve AI data quality risk report | `/datasets/[id]` (Tab 6 - Quality) |
| `POST` | `/api/v1/datasets/{id}/ai/recommendations` | Generate/retrieve AI cleaning playbook | `/datasets/[id]` (Tab 6 - Playbook) |
| `POST` | `/api/v1/datasets/{id}/ai/column` | Generate deep AI explanation for a single column | `/datasets/[id]` (Tab 6 - Column) |
| `POST` | `/api/v1/datasets/{id}/ai/chat` | Conversational Q&A on dataset | `/datasets/[id]` (Tab 6 - Chat) |
| `POST` | `/api/v1/datasets/{id}/generate/sql` | Generate DuckDB/Postgres cleaning SQL | `/datasets/[id]` (Tab 7) |
| `POST` | `/api/v1/datasets/{id}/generate/pyspark` | Generate distributed PySpark ETL script | `/datasets/[id]` (Tab 7) |
| `POST` | `/api/v1/datasets/{id}/ai/analyst` | Autonomous English $\to$ SQL $\to$ Athena $\to$ Root Cause | `/datasets/[id]` (Tab 10) |

---

## 2. Detailed API Specifications

---

### `POST /api/v1/upload`
- **Purpose:** Ingests a raw data file, validates integrity, and automatically computes statistical profiling metrics.
- **Input:** Multipart Form Data (`file: UploadFile`).
- **Processing Logic:**
  1. Validates file extension is `.csv`, `.xlsx`, or `.xls`.
  2. Validates file size $\le 50\text{ MB}$.
  3. Writes file to disk/storage.
  4. Calls `DatasetProfiler.profile_file()`.
  5. Inserts `Dataset` record and `DatasetProfile` record in DB.
- **Output:**
  ```json
  {
    "id": "c7a9b3d2-4e8f-41a2-93cb-123456789abc",
    "original_filename": "customers-100.csv",
    "stored_filename": "c7a9b3d2-4e8f-41a2-93cb-123456789abc.csv",
    "storage_type": "LOCAL",
    "file_size": 14208,
    "file_extension": "csv",
    "mime_type": "text/csv",
    "storage_path": "uploads/c7a9b3d2-4e8f-41a2-93cb-123456789abc.csv",
    "upload_status": "COMPLETED",
    "created_at": "2026-08-21T00:00:00Z",
    "updated_at": "2026-08-21T00:00:00Z"
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: Unsupported file extension or corrupt file.
  - `413 Payload Too Large`: File exceeds 50MB limit.

---

### `GET /api/v1/datasets/{id}/profile`
- **Purpose:** Retrieves the full profile metadata (data types, nulls, statistical moments, outlier boundaries) for a dataset.
- **Input:** Path parameter `id: str`.
- **Output:**
  ```json
  {
    "dataset_id": "c7a9b3d2-4e8f-41a2-93cb-123456789abc",
    "profile_data": {
      "total_rows": 100,
      "total_columns": 12,
      "health_score": 96,
      "health_breakdown": ["Passing quality audit", "Low null ratio"],
      "columns": {
        "Index": {
          "inferred_type": "Integer",
          "null_count": 0,
          "distinct_count": 100,
          "min": 1,
          "max": 100,
          "mean": 50.5,
          "std": 29.01,
          "outlier_count": 0
        }
      }
    }
  }
  ```
- **Error Codes:**
  - `404 Not Found`: Dataset ID not found in database.

---

### `POST /api/v1/datasets/{id}/ai/analyst`
- **Purpose:** Autonomous AI Analyst that translates natural language questions into Athena SQL, executes the query on AWS, and synthesizes root-cause recommendations.
- **Input Payload:**
  ```json
  {
    "question": "Which customer cities have the highest number of subscriptions?"
  }
  ```
- **Processing Logic:**
  1. Retrieves table schema from Glue Catalog or Dataset Profile.
  2. Calls Gemini to write a safe `SELECT` SQL query against AWS Athena.
  3. Validates query safety (blocks `DROP`, `DELETE`, `INSERT`, `ALTER`).
  4. Runs query via `AthenaService.run_query()` under the configured workgroup (with a 100MB scan limit).
  5. Feeds result data back to Gemini to synthesize root cause and actionable takeaways.
- **Output:**
  ```json
  {
    "question": "Which customer cities have the highest number of subscriptions?",
    "generated_sql": "SELECT city, count(*) as count FROM \"data_detective\".\"tbl_c7a9\" GROUP BY city ORDER BY count DESC LIMIT 10;",
    "query_execution_time_ms": 1240,
    "data_scanned_mb": 0.04,
    "results": [
      {"city": "Mumbai", "count": 28},
      {"city": "Bangalore", "count": 22}
    ],
    "ai_explanation": "Mumbai represents the largest concentration of active subscriptions...",
    "root_cause_findings": "High metropolitan adoption driven by regional marketing campaigns.",
    "recommendations": ["Expand regional infrastructure in top 3 cities", "Review rural churn metrics"]
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: Unsafe SQL generated or invalid table state.
  - `503 Service Unavailable`: Gemini API or AWS Athena unreachable.
