import re

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models.models import Show
from app.schemas.schemas import ShowIn, ShowUpdate, ShowOut
from app.core.dependencies import require_editor

router = APIRouter(prefix="/admin/shows", tags=["shows"])


def slugify(t: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")


def _unique_slug(db: Session, title: str) -> str:
    base = slugify(title) or "show"
    slug = base
    i = 2
    while db.query(Show).filter(Show.slug == slug).first():
        slug = f"{base}-{i}"
        i += 1
    return slug


@router.get("")
def list_shows(
    section: str | None = None,
    status: str | None = None,
    q: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(require_editor),
):
    query = db.query(Show)
    if section:
        query = query.filter(Show.section == section)
    if status:
        query = query.filter(Show.status == status)
    if q:
        query = query.filter(Show.title.ilike(f"%{q}%"))

    total = query.count()
    items = (
        query.order_by(Show.title)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": max(1, -(-total // page_size)),
        "items": [ShowOut.model_validate(s).model_dump() for s in items],
    }


@router.post("", response_model=ShowOut, status_code=201)
def create_show(
    body: ShowIn, db: Session = Depends(get_db), user=Depends(require_editor)
):
    show = Show(**body.model_dump(), slug=_unique_slug(db, body.title))
    db.add(show)
    db.commit()
    db.refresh(show)
    return show


@router.get("/{show_id}", response_model=ShowOut)
def get_show(show_id: int, db: Session = Depends(get_db), user=Depends(require_editor)):
    show = db.get(Show, show_id)
    if not show:
        raise HTTPException(404, "Show not found")
    return show


@router.patch("/{show_id}", response_model=ShowOut)
def update_show(
    show_id: int,
    body: ShowUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_editor),
):
    show = db.get(Show, show_id)
    if not show:
        raise HTTPException(404, "Show not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(show, k, v)
    db.commit()
    db.refresh(show)
    return show


@router.delete("/{show_id}", status_code=204)
def delete_show(
    show_id: int, db: Session = Depends(get_db), user=Depends(require_editor)
):
    show = db.get(Show, show_id)
    if not show:
        raise HTTPException(404, "Show not found")
    db.delete(show)
    db.commit()
