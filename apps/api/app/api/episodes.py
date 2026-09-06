from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models.models import Episode, Season
from app.schemas.schemas import EpisodeIn, EpisodeUpdate, EpisodeOut
from app.core.dependencies import require_editor

router = APIRouter(tags=["episodes"])


@router.get("/admin/seasons/{season_id}/episodes")
def list_episodes(
    season_id: int, db: Session = Depends(get_db), user=Depends(require_editor)
):
    if not db.get(Season, season_id):
        raise HTTPException(404, "Season not found")
    eps = (
        db.query(Episode)
        .filter(Episode.season_id == season_id)
        .order_by(Episode.episode_number)
        .all()
    )
    return [
        {
            "id": e.id,
            "title": e.title,
            "description": e.description,
            "episode_number": e.episode_number,
            "content_group": e.content_group,
            "language": e.language,
            "duration_seconds": e.duration_seconds,
            "status": e.status,
        }
        for e in eps
    ]


@router.post(
    "/admin/seasons/{season_id}/episodes", response_model=EpisodeOut, status_code=201
)
def create_episode(
    season_id: int,
    body: EpisodeIn,
    db: Session = Depends(get_db),
    user=Depends(require_editor),
):
    if not db.get(Season, season_id):
        raise HTTPException(404, "Season not found")
    data = body.model_dump()
    data["content_group"] = str(data["content_group"])
    ep = Episode(season_id=season_id, **data)
    db.add(ep)
    db.commit()
    db.refresh(ep)
    return ep


@router.patch("/admin/episodes/{episode_id}", response_model=EpisodeOut)
def update_episode(
    episode_id: int,
    body: EpisodeUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_editor),
):
    ep = db.get(Episode, episode_id)
    if not ep:
        raise HTTPException(404, "Episode not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(ep, k, v)
    db.commit()
    db.refresh(ep)
    return ep


@router.delete("/admin/episodes/{episode_id}", status_code=204)
def delete_episode(
    episode_id: int, db: Session = Depends(get_db), user=Depends(require_editor)
):
    ep = db.get(Episode, episode_id)
    if not ep:
        raise HTTPException(404, "Episode not found")
    db.delete(ep)
    db.commit()
