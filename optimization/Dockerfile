FROM python:3.11-slim

WORKDIR /app

# Build deps:
#   gcc + libpq-dev  → psycopg2-binary, asyncpg
#   libffi-dev       → cryptography / bcrypt
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip first to avoid legacy resolver issues
RUN pip install --no-cache-dir --upgrade pip

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]
