# Build the Django backend (backend/ folder)
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip
COPY backend/requirements.txt .
RUN pip install -r requirements.txt gunicorn

COPY backend/ .

RUN python manage.py collectstatic --no-input --clear 2>/dev/null || true

# Sevalla injects PORT (default 8080)
CMD gunicorn api.wsgi:application --bind 0.0.0.0:${PORT:-8080} --workers 2 --threads 4
