# Deploying the Eshop Backend on Sevalla

This guide covers deploying the Django backend to [Sevalla](https://sevalla.com) with Docker and a hosted PostgreSQL database.

## Prerequisites

- A Sevalla account
- Git repository connected to Sevalla

## 1. Create a PostgreSQL Database on Sevalla

1. In Sevalla, go to **Databases** → **Create database**
2. Choose **PostgreSQL** (recommend 14 or newer)
3. Set:
   - **Database name** (e.g. `eshop_db`)
   - **Database user** (e.g. `eshop_user`)
   - **Database password** (or use the generated one)
4. Create the database in the **same region** as your application (required for internal connections)
5. Note the connection details or attach the database to your app (Sevalla will auto-populate env vars)

## 2. Deploy the Application

1. Create a new **Application** on Sevalla
2. Connect your Git repository
3. **Build settings:**
   - **Build strategy:** Dockerfile
   - **Dockerfile path:** `backend/Dockerfile`
   - **Context:** `backend` (the directory containing the Dockerfile)

4. **Environment variables** – Set these in Sevalla → Application → Settings → Environment:

   | Variable       | Required | Description                                                       |
   |----------------|----------|-------------------------------------------------------------------|
   | `SECRET_KEY`   | Yes      | Django secret key (e.g. generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`) |
   | `DEBUG`        | No       | Set to `False` in production                                      |
   | `ALLOWED_HOSTS`| Yes      | Your Sevalla app URL, e.g. `your-app.sevalla.com`                 |

   **Database** – Either:

   - **Option A:** Attach the PostgreSQL database in Sevalla; it will auto-populate `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
   - **Option B:** Set `DATABASE_URL` manually:  
     `postgres://USER:PASSWORD@HOST:PORT/DBNAME`  
     (Use URL-encoding for special characters in the password)

5. Sevalla sets `PORT` automatically; the container binds to it.

## 3. Database Configuration Summary

The app supports two ways to configure PostgreSQL:

| Mode           | Variables                                      |
|----------------|------------------------------------------------|
| Individual     | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` |
| Connection URL | `DATABASE_URL=postgres://user:pass@host:port/dbname`      |

If both are set, `DATABASE_URL` takes precedence.

## 4. First Deploy

On first deploy:

1. Migrations run automatically via `entrypoint.sh` before starting the app
2. After deploy, you may need to create a superuser:
   - Use Sevalla’s **Web Terminal** on your application
   - Run: `python manage.py createsuperuser`

## 5. Media Files

For user uploads (images, etc.), configure persistent storage in Sevalla and set `MEDIA_ROOT` (and optionally a CDN) as needed for your setup.

## 6. Local .env Reference

Copy `backend/.env.example` to `backend/.env` and fill in values for local development. See the example file for all supported variables.
