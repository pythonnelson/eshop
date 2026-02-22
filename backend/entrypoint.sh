#!/bin/bash
set -e

# Run migrations only if SKIP_MIGRATIONS is not set
if [ -z "${SKIP_MIGRATIONS}" ]; then
  echo "Running migrations..."
  if python manage.py migrate --no-input 2>&1; then
    echo "Migrations completed."
  else
    echo "Migrations failed - starting app anyway. Set SKIP_MIGRATIONS=1 to skip, or fix DB and redeploy."
  fi
else
  echo "Skipping migrations (SKIP_MIGRATIONS is set)."
fi

# Sevalla injects PORT - must bind to 0.0.0.0
PORT="${PORT:-8000}"
echo "Starting gunicorn on 0.0.0.0:$PORT"
exec gunicorn api.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120
