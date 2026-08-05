# Architecture Overview

Data Detective AI employs a modern decoupled architecture:

1. **Frontend**: Next.js App Router served via a Dockerized Node runtime. Uses React Query for data state, Framer Motion for premium UI animations, and Tailwind CSS for styling.
2. **Backend**: FastAPI web app exposed through Uvicorn. Includes an AWS Lambda ready configuration using Mangum.
3. **Storage**: Standardized storage service supporting local disk storage or Amazon S3 based on configuration.
