from fastapi import APIRouter
from sqlalchemy import text

from app.db.database import engine
from app.storage import get_storage

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    db_ok = True
    storage_ok = True
    try:
        with engine.connect() as c:
            c.execute(text("SELECT 1"))
    except Exception:
        db_ok = False
    try:
        get_storage().exists("_probe")
    except Exception:
        storage_ok = False
    return {
        "status": "ok" if db_ok and storage_ok else "degraded",
        "database": "ok" if db_ok else "error",
        "storage": "ok" if storage_ok else "error",
    }
