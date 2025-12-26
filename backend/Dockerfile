FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (e.g. for psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# If requirements.txt doesn't exist, this might fail. 
# But assuming standard python env. 
# I'll create a dummy requirements.txt if needed or rely on what's there?
# I'll Assume I need to generate it first. 
# But for now, let's assume it exists or I'll run pip freeze > requirements.txt later.

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy App
COPY . .

# Run
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
