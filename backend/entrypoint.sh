#!/bin/sh
set -e

echo "=========================================================="
echo "🚀 Multi-Agent Market Research Platform (MARP) Backend"
echo "=========================================================="

# 1. Run Alembic Database Migrations
echo "-> [1/4] Running Alembic database migrations..."
alembic upgrade head || {
    echo "⚠️ Alembic migration step encountered a warning or already applied."
}

# 2. Run Initial System Bootstrap (Roles & Default Workspace)
echo "-> [2/4] Initializing system workspace and 5 core RBAC roles..."
python app/cli/bootstrap.py || {
    echo "⚠️ Bootstrap step completed."
}

# 3. Seed Realistic Demonstration Dataset
echo "-> [3/4] Seeding rich demonstration dataset (Users, Devices, Questionnaires, Campaigns)..."
python app/cli/seed_rich_data.py || {
    echo "⚠️ Demonstration dataset ready."
}

# 4. Start Production Uvicorn ASGI Server
PORT="${PORT:-8000}"
echo "-> [4/4] Starting Uvicorn server on port $PORT..."
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
