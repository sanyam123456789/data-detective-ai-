# 11. Known Issues and Improvements — Data Detective AI

---

## 1. Confirmed Issues & Technical Constraints

### Issue 1: Large File Memory Ceiling (>500MB) in Local Mode
- **Category:** `CONFIRMED ISSUE`
- **Problem:** The local profiler loads the entire dataset into Pandas in RAM (`pd.read_csv()`). While efficient for files up to 50MB, datasets larger than 500MB can cause out-of-memory (OOM) errors in low-resource environments.
- **Why it matters:** Uploading multi-gigabyte files could exhaust server memory.
- **How to improve it:** Use chunked streaming (`chunksize=50000`) in Pandas or use DuckDB / Polars for memory-mapped, out-of-core file scanning.

### Issue 2: SQLite Concurrency Lock in Heavy Multi-User Writes
- **Category:** `CONFIRMED ISSUE`
- **Problem:** When multiple users simultaneously upload files in local SQLite mode, SQLite may return a `database is locked` error because SQLite locks the whole file during write operations.
- **Why it matters:** Limits concurrency in multi-user test environments.
- **How to improve it:** In production, switch the `DATABASE_URL` in `.env` to a managed PostgreSQL instance (e.g. Amazon RDS PostgreSQL).

---

## 2. Possible Improvements

### Improvement 1: Background Asynchronous Processing with Celery/Redis
- **Category:** `POSSIBLE IMPROVEMENT`
- **Problem:** Profiling very large files runs synchronously inside the HTTP request cycle. If a file takes 15 seconds to profile, the client connection remains open.
- **Why it matters:** Could lead to HTTP gateway timeouts behind reverse proxies like Nginx or AWS ALB.
- **How to improve it:** Offload file profiling and AWS lakehouse curation to a Celery worker with Redis queue, returning a task ID to poll via WebSocket or React Query.

### Improvement 2: User Authentication & Role-Based Access Control (RBAC)
- **Category:** `POSSIBLE IMPROVEMENT`
- **Problem:** Currently, all uploaded datasets in the catalog are publicly visible to anyone accessing the frontend.
- **Why it matters:** Enterprise deployments require data privacy and role separation (e.g., Admin vs Analyst vs Viewer).
- **How to improve it:** Add JWT-based authentication (OAuth2 / Auth0) with user ownership fields on the `Dataset` model.

---

## 3. Nice-to-Have Features

### Nice-to-Have 1: Automated Slack / Teams Quality Webhook Alerts
- **Category:** `NICE TO HAVE`
- **Description:** Automatically dispatch a Slack notification whenever an incoming pipeline dataset has a Health Score below 75% or contains critical Z-score outliers.
- **How to implement:** Add a webhook dispatcher in `backend/app/services/alert_service.py` that sends JSON payloads to Slack Incoming Webhooks.

### Nice-to-Have 2: Exportable PDF Forensic Audit Reports
- **Category:** `NICE TO HAVE`
- **Description:** Allow users to download a branded, PDF-formatted compliance report summarizing all data quality findings, AI executive summaries, and schema definitions.
- **How to implement:** Use `WeasyPrint` or `ReportLab` in Python to render HTML templates into downloadable PDF reports.
