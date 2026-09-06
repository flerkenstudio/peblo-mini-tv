from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.validation import build_report
from app.core.dependencies import require_editor

router = APIRouter(tags=["validation"])


@router.get("/admin/validation-report")
def validation_report(db: Session = Depends(get_db), user=Depends(require_editor)):
    return build_report(db)
