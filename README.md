# Data Detective AI 🔍🚀

Data Detective AI is a production-grade SaaS platform built to ingest, profile, and transform datasets.

This is the **Phase 1.5 Architecture Upgrade**, which introduces SQLAlchemy SQLite database models, abstract multi-provider Storage Service implementations, safe UUID storage keys, and versioned `/api/v1/` endpoints.

---

## 🏗️ Platform Architectures

### 1. Database Architecture (SQLite + SQLAlchemy)
We utilize a relational SQLite model for dataset metadata persistence:
- **ORM Declarative Base**: Integrated in `database/base.py` and connected through `database/session.py`.
- **Schema Model**: Defines parameters like unique UUID primary keys, original/stored file properties, file extensions, MIME types, and timestamps.
- **Repository Pattern**: Extracted SQL operations into `dataset_repo.py` to prevent SQL coupling inside endpoints logic.

### 2. Storage Service Architecture (Polymorphic Class)
The ingestion layer is built using a decoupled design pattern:
- **`StorageService` (Abstract)**: An abstract class declaring standard file writing guidelines.
- **`LocalStorageService`**: Concrete implementation saving datasets to a server directory fallback path (dev out-of-the-box mode).
- **`S3StorageService`**: Concrete implementation streaming files to Amazon S3 buckets.
- **Service Factory**: Uses a `get_storage_service()` helper to instantiate the active class dynamically based on `STORAGE_PROVIDER` configurations.

### 3. Upload Flow & Pipeline
```text
Upload File (Multipart/form-data)
      │
      ▼
Format Validation (accepts only .csv, .xls, .xlsx)
      │
      ▼
Size Limit Check (max upload limit verified from env)
      │
      ▼
Read Transient Preview (returns first 10 rows without storing)
      │
      ▼
Generate UUID filename (e.g. "a6f2d1a8_sales.csv")
      │
      ▼
Upload via StorageService (S3 or Local folder)
      │
      ▼
Save Metadata in SQLite DB via DatasetRepository
      │
      ▼
Return metadata and preview to React client response
```

---

## 📁 Folder Structure

```text
data-detective/
├── frontend/                  # Next.js client application
│   ├── src/
│   │   ├── app/               # Page routes (querying /api/v1/ endpoints)
│   │   ├── components/        # Reusable UI & Layout navigation
│   │   └── services/          # Client state contexts
│   └── Dockerfile
├── backend/                   # FastAPI backend server
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       └── endpoints.py # Versioned API controllers
│   │   ├── core/
│   │   │   ├── config.py      # Pydantic Settings parameters
│   │   │   ├── exceptions.py  # Custom exception metrics
│   │   │   └── exception_handlers.py # Centralized HTTP response maps
│   │   ├── database/          # SQLite Session configurations
│   │   ├── models/            # SQLAlchemy Database model classes
│   │   ├── repositories/      # Repository SQL access patterns
│   │   └── services/          # Abstract Storage Services
│   └── Dockerfile
├── docker-compose.yml         # Container composer
├── .env                       # Active environment configurations
└── README.md                  # This file
```

---

## ⚡ Setup & Launching

1. Ensure a local `.env` is initialized:
   ```bash
   cp .env.example .env
   ```
2. Build and launch containers:
   ```bash
   docker-compose up --build
   ```
3. Verify access:
   - **Frontend App**: [http://localhost:3000](http://localhost:3000)
   - **Backend Engine (API v1)**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
   - **Swagger OpenAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📡 API Version 1 Endpoints

- **`GET /api/v1/health`**: Diagnostic system health, active storage provider state, database connections, and configs.
- **`POST /api/v1/upload`**: Validates file size limits and extensions, uploads content, writes to SQLite database, and parses a transient 10-row dataset preview returned directly in response.
- **`GET /api/v1/datasets`**: Lists metadata profiles of all uploaded files queried directly from SQLite.
