#!/bin/bash
set -e

# Run migrations (database must be reachable; Sevalla injects DB_* or DATABASE_URL)
echo "Running migrations..."
python manage.py migrate --no-input

echo "Starting application..."
exec gunicorn api.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --threads 4
