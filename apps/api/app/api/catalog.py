import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models.models import PublishRun
from app.core.dependencies import require_editor
from app.services.publisher import publish
from app.storage import get_storage

router = APIRouter(tags=["catalog"])

# ---------- CMS PUBLISH (Admin & Editor) ----------


@router.post("/admin/catalog/publish")
def do_publish(db: Session = Depends(get_db), user=Depends(require_editor)):
    result = publish(db, triggered_by=user.email)
    if not result["success"]:
        raise HTTPException(422, detail=result)
    return result


@router.get("/admin/catalog/publish-runs")
def publish_runs(db: Session = Depends(get_db), user=Depends(require_editor)):
    runs = (
        db.query(PublishRun).order_by(PublishRun.started_at.desc()).limit(20).all()
    )
    return [
        {
            "id": r.id,
            "started_at": r.started_at,
            "completed_at": r.completed_at,
            "triggered_by": r.triggered_by,
            "status": r.status,
            "shows": r.published_show_count,
            "episodes": r.published_episode_count,
            "version": r.catalogue_version,
            "error": r.error_message,
        }
        for r in runs
    ]


# ---------- VIEWER (reads the published catalogue file ONLY — never the DB) ----------


def _load_catalogue() -> dict:
    raw = get_storage().read_catalogue()
    if raw is None:
        raise HTTPException(404, "No catalogue published yet")
    return json.loads(raw)


@router.get("/catalog")
def get_catalog():
    return _load_catalogue()


@router.get("/catalog/search")
def search_catalog(
    q: str | None = None,
    category: str | None = None,
    language: str | None = None,
    section: str | None = None,
):
    cat = _load_catalogue()
    results = []
    for sec in cat.get("sections", []):
        if section and sec["name"].lower() != section.lower():
            continue
        for show in sec["shows"]:
            if category:
                cat_lower = category.lower()
                show_cats = [c.strip().lower() for c in (show.get("category") or "").split(",") if c.strip()]
                if show.get("categories"):
                    show_cats.extend([c.strip().lower() for c in show["categories"]])
                if cat_lower not in show_cats and (show.get("category") or "").lower() != cat_lower:
                    continue

            if q:
                title_match = q.lower() in show["title"].lower()
                synopsis_match = q.lower() in (show.get("synopsis") or "").lower()
                ep_match = any(
                    q.lower() in e["title"].lower()
                    for s in show["seasons"]
                    for e in s["episodes"]
                )
                if not (title_match or synopsis_match or ep_match):
                    continue

            if language:
                lang_match = any(
                    language.lower() in [l.lower() for l in e["languages"]]
                    for s in show["seasons"]
                    for e in s["episodes"]
                )
                if not lang_match:
                    continue

            results.append(show)

    return {"count": len(results), "shows": results}
