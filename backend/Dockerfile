FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source code
COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads

# Expose FastAPI server port
EXPOSE 8000

# Run uvicorn server in container
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

