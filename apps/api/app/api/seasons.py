from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models.models import Season, Show
from app.schemas.schemas import SeasonIn, SeasonOut
from app.core.dependencies import require_editor

router = APIRouter(tags=["seasons"])


@router.get("/admin/shows/{show_id}/seasons")
def list_seasons(show_id: int, db: Session = Depends(get_db), user=Depends(require_editor)):
    if not db.get(Show, show_id):
        raise HTTPException(404, "Show not found")
    seasons = (
        db.query(Season)
        .filter(Season.show_id == show_id)
        .order_by(Season.season_number)
        .all()
    )
    return [
        {
            "id": s.id,
            "show_id": s.show_id,
            "season_number": s.season_number,
            "title": s.title,
            "episode_count": len(s.episodes),
        }
        for s in seasons
    ]


@router.post("/admin/shows/{show_id}/seasons", response_model=SeasonOut, status_code=201)
def create_season(
    show_id: int,
    body: SeasonIn,
    db: Session = Depends(get_db),
    user=Depends(require_editor),
):
    if not db.get(Show, show_id):
        raise HTTPException(404, "Show not found")
    season = Season(show_id=show_id, **body.model_dump())
    db.add(season)
    db.commit()
    db.refresh(season)
    return season


@router.patch("/admin/seasons/{season_id}", response_model=SeasonOut)
def update_season(
    season_id: int,
    body: SeasonIn,
    db: Session = Depends(get_db),
    user=Depends(require_editor),
):
    season = db.get(Season, season_id)
    if not season:
        raise HTTPException(404, "Season not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(season, k, v)
    db.commit()
    db.refresh(season)
    return season


@router.delete("/admin/seasons/{season_id}", status_code=204)
def delete_season(
    season_id: int, db: Session = Depends(get_db), user=Depends(require_editor)
):
    season = db.get(Season, season_id)
    if not season:
        raise HTTPException(404, "Season not found")
    db.delete(season)
    db.commit()
