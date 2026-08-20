# 6. Database Guide — Data Detective AI

---

## 1. Database Overview

- **Database Engine:** SQLite (local development / testing) or PostgreSQL (production).
- **ORM / Driver:** SQLAlchemy 2.0.
- **Connection Management:** `backend/app/database/session.py` provides session dependency injection (`get_db()`).
- **Data Access Pattern:** Repository Pattern (`backend/app/repositories/`).

---

## 2. Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────┐
│            datasets             │
├─────────────────────────────────┤
│ id (PK, UUID String)            │ ◄──────────┐
│ original_filename (String)      │            │
│ stored_filename (String, Unique)│            │
│ storage_type (LOCAL / S3)       │            │
│ file_size (Integer)             │            │
│ file_extension (String)         │            │
│ mime_type (String)              │            │
│ storage_path (String)           │            │
│ upload_status (String)          │            │
│ pipeline_status (String)        │            │
│ raw_s3_key (String, Nullable)   │            │
│ curated_s3_key (String)         │            │
│ catalog_database (String)       │            │
│ catalog_table (String)          │            │
│ pipeline_error (Text, Nullable) │            │
│ processed_at (DateTime)         │            │
│ created_at (DateTime)           │            │
│ updated_at (DateTime)           │            │
└─────────────────────────────────┘            │
                 │ 1                           │ 1
                 │                             │
                 ▼ 1 (Cascade Delete)          ▼ N (Cascade Delete)
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│        dataset_profiles         │   │           ai_insights           │
├─────────────────────────────────┤   ├─────────────────────────────────┤
│ id (PK, UUID String)            │   │ id (PK, UUID String)            │
│ dataset_id (FK -> datasets.id)  │   │ dataset_id (FK -> datasets.id)  │
│ total_rows (Integer)            │   │ insight_type (String)           │
│ total_columns (Integer)         │   │ content_json (Text)             │
│ health_score (Integer)          │   │ created_at (DateTime)           │
│ total_missing_values (Integer)  │   │ updated_at (DateTime)           │
│ total_duplicate_rows (Integer)  │   └─────────────────────────────────┘
│ memory_usage_bytes (Integer)    │
│ total_outliers (Integer)        │
│ profile_data_json (Text)        │
│ created_at (DateTime)           │
└─────────────────────────────────┘
```

---

## 3. Database Table Definitions

### Table 1: `datasets`
- **Purpose:** Primary registry of all uploaded data files and their cloud pipeline states.
- **Key Columns:**
  - `id` (VARCHAR / TEXT, PK): Unique UUID identifying the dataset.
  - `original_filename` (VARCHAR): User-facing filename (e.g., `customers-100.csv`).
  - `stored_filename` (VARCHAR, Unique): Internal disk/S3 filename preventing name collisions.
  - `storage_type` (VARCHAR): Either `"LOCAL"` or `"S3"`.
  - `pipeline_status` (VARCHAR): Tracks AWS Lakehouse ingestion status (`LOCAL`, `UPLOADED`, `PROCESSING`, `CURATED`, `CATALOGED`, `READY`, `FAILED`).
  - `catalog_database` & `catalog_table`: AWS Glue schema names for Athena SQL queries.

### Table 2: `dataset_profiles`
- **Purpose:** Stores calculated statistical summaries and detailed column profile trees.
- **Key Columns:**
  - `id` (VARCHAR / TEXT, PK): Unique UUID.
  - `dataset_id` (VARCHAR, FK): Points to `datasets.id` with `ondelete="CASCADE"`.
  - `total_rows` & `total_columns`: Row and column counts.
  - `health_score` (Integer): Quality score from 0 to 100%.
  - `total_missing_values`, `total_duplicate_rows`, `total_outliers`: Aggregate defect counts.
  - `profile_data_json` (TEXT): Complete JSON string containing column-level types, quartiles, IQR bounds, and category frequencies.

### Table 3: `ai_insights`
- **Purpose:** Caching layer for Gemini 2.0 AI responses. Prevents redundant API calls and reduces LLM billing costs.
- **Key Columns:**
  - `id` (VARCHAR / TEXT, PK): Unique UUID.
  - `dataset_id` (VARCHAR, FK): Points to `datasets.id` with `ondelete="CASCADE"`.
  - `insight_type` (VARCHAR): Type of insight (`summary`, `quality`, `recommendations`, `column_{colname}`).
  - `content_json` (TEXT): Serialized JSON structure of the AI analysis.

---

## 4. Database Lifecycle & CRUD Flows

1. **Create:**
   - On file upload, `DatasetRepository.create()` inserts a new `Dataset` row.
   - `DatasetProfileRepository.create_or_update()` computes and saves the `DatasetProfile` row.
2. **Read:**
   - Dashboard calls `DatasetRepository.list_all()` and left-joins `DatasetProfile` for KPI metrics.
   - Dataset Dossier calls `DatasetProfileRepository.get_by_dataset_id()`.
3. **Update:**
   - When the AWS Lakehouse pipeline runs, `DatasetRepository.update_pipeline_status()` updates `pipeline_status`, `raw_s3_key`, `curated_s3_key`, and `catalog_table`.
   - When AI analyzes data, `AIInsightRepository.save_insight()` writes or updates cached JSON.
4. **Delete:**
   - Deleting a dataset cascades and automatically removes all associated rows in `dataset_profiles` and `ai_insights`.
