# 4. Tech Stack Guide — Data Detective AI

---

## 1. Complete Technology Stack Table

| Technology | Where Used | Why We Use It | Simple Explanation |
| :--- | :--- | :--- | :--- |
| **Next.js 14 (App Router)** | Frontend Web Framework | Fast server-side rendering, file-based routing, modern React architecture | Lets us build fast, SEO-friendly pages with clean URL folder routes. |
| **React 18** | Frontend UI Library | Reusable UI components and state management | Divides the entire web application into modular pieces like Navbar, Cards, Charts, and Tabs. |
| **TypeScript** | Frontend Type Safety | Prevents runtime bugs with compile-time type checking | Catches coding mistakes and undefined object properties before deploying. |
| **Tailwind CSS** | Styling & Theme System | Utility-first styling for fast, responsive design | Lets us style UI directly in JSX using clean utility classes without messy custom CSS files. |
| **Lucide React** | Icons Library | Modern, lightweight SVG icons | Provides icons like Database, Cloud, Terminal, and Sparkles for visual clarity. |
| **Framer Motion** | UI Animation Library | Smooth page transitions and alerts | Adds smooth enter/exit animations to dropzones, alerts, and mobile menus. |
| **Recharts** | Data Visualization | Interactive, responsive SVG charts | Renders missing value bar charts, completeness gauges, and schema pie charts. |
| **TanStack React Query** | Frontend Data Fetching | Automated API caching, refetching, and state management | Automatically caches backend API responses so pages load instantly without redundant fetches. |
| **Python 3.11+** | Backend Programming Language | Standard for modern data engineering and AI | Fast, robust language with top-tier libraries for data processing and machine learning. |
| **FastAPI** | Backend Web Framework | High-performance async REST API with auto OpenAPI docs | Generates fast API endpoints with automatic JSON schema validation via Pydantic. |
| **Uvicorn** | ASGI Web Server | Lightning-fast asynchronous server for FastAPI | Runs the Python backend service and handles concurrent HTTP requests. |
| **Pandas** | Data Processing Engine | In-memory data manipulation and statistical analysis | Reads CSV/Excel into DataFrames, calculates stats, nulls, quartiles, and data types. |
| **SQLAlchemy 2.0** | Database ORM | Python object-relational mapping | Lets us query and save database records using Python classes instead of writing raw SQL strings. |
| **Pydantic v2** | Data Validation | Request and response schema validation | Validates incoming JSON payloads and guarantees API response consistency. |
| **Google Gemini 2.0 Flash (`google-genai`)** | AI / LLM Intelligence | Fast, cost-efficient reasoning and code synthesis | Generates executive summaries, SQL/PySpark code, and powers the autonomous AI analyst. |
| **Boto3 (AWS SDK)** | Cloud Lakehouse Integration | Interacts with AWS S3, AWS Glue, and Amazon Athena | Python library that uploads files to S3, registers Glue tables, and runs Athena queries. |
| **AWS S3** | Cloud Object Storage | Scalable storage for raw and curated dataset files | Stores raw uploaded CSVs and curated Parquet files reliably in the cloud. |
| **AWS Glue Data Catalog** | Metadata Catalog | Central schema registry for Lakehouse tables | Stores table schemas so Amazon Athena knows how to read S3 data. |
| **Amazon Athena** | Serverless SQL Query Engine | Runs distributed SQL queries directly over S3 data | Lets us query gigabytes of data in S3 using standard ANSI SQL without managing any servers. |
| **Pytest** | Testing Suite | Automated unit and integration testing | Runs 102 automated tests to verify profiler logic, quality engine, and API endpoints. |

---

## 2. "Why Did We Use This?" (Deep Dive)

### Why FastAPI instead of Django or Flask?
- **Speed & Async:** FastAPI is built on top of Starlette and Pydantic, making it one of the fastest Python frameworks available.
- **Automatic Documentation:** It auto-generates interactive Swagger UI docs at `/docs`.
- **Type Safety:** FastAPI enforces Pydantic models on every request and response, preventing runtime payload bugs.

### Why Next.js 14 instead of plain React (Vite/CRA)?
- **Modern App Router:** Provides clean nested routing (`/datasets/[id]`) and clean layout nesting (`layout.tsx`).
- **Server and Client Optimization:** Lets us use client components (`'use client'`) for interactive state while keeping bundle sizes small.

### Why Google Gemini 2.0 Flash?
- **Speed & Latency:** Gemini 2.0 Flash has near-instant response times, which is essential for interactive chat and live SQL generation.
- **Large Context Window:** Capable of ingesting full dataset schema descriptions, column summaries, and historical conversation turns without running out of tokens.
- **Cost Efficiency:** Significantly more affordable than older models while delivering superior code generation quality.

### Why AWS S3 + Glue + Athena (Serverless Lakehouse)?
- **Zero Server Management:** We don't have to manage or pay for 24/7 database instances. We only pay for the queries we run and the data stored in S3.
- **Separation of Storage & Compute:** Data is stored cheaply in S3, while Athena scales compute power on-demand during query execution.
- **Industry Standard:** This exact architecture (S3 $\to$ Glue $\to$ Athena) is used by top enterprise data engineering teams.

### Why SQLAlchemy ORM with Repository Pattern?
- **Database Agnostic:** The code works out-of-the-box with SQLite for local development and easily switches to PostgreSQL in production by changing `DATABASE_URL`.
- **Clean Architecture:** Isolating database queries in `repositories/` keeps API route handlers clean and easily testable.
