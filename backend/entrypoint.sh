#!/bin/bash
set -e

# Run migrations (non-fatal so app still starts if DB is temporarily unreachable)
echo "Running migrations..."
python manage.py migrate --no-input || echo "Migrations failed - starting anyway"

# Must bind to 0.0.0.0 and PORT (Sevalla injects PORT)
export PORT="${PORT:-8000}"
echo "Starting gunicorn on 0.0.0.0:$PORT"
exec gunicorn api.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --threads 4
