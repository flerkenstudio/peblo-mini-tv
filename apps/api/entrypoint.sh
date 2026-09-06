#!/bin/sh
set -e
# Create tables if they don't exist (idempotent)
python -c "from app.db.database import engine, Base; import app.db.models.models; Base.metadata.create_all(engine)"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
