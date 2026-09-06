from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models.models import Episode, Season
from app.schemas.schemas import EpisodeIn, EpisodeUpdate, EpisodeOut
from app.core.dependencies import require_editor
from app.storage import get_storage

router = APIRouter(tags=["episodes"])

ALLOWED_VIDEO_EXTENSIONS = (".mp4", ".webm", ".mov", ".mkv", ".m4v")


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
    storage = get_storage()
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
            "video_key": e.video_key,
            "video_url": storage.get_url(e.video_key) if e.video_key else None,
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
    if ep.video_key:
        get_storage().delete(ep.video_key)
    db.delete(ep)
    db.commit()


@router.post("/admin/episodes/{episode_id}/video")
def upload_episode_video(
    episode_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(require_editor),
):
    ep = db.get(Episode, episode_id)
    if not ep:
        raise HTTPException(404, "Episode not found")

    filename = file.filename or "video.mp4"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    content_type = file.content_type or ""

    if ext not in ALLOWED_VIDEO_EXTENSIONS and not content_type.startswith("video/"):
        raise HTTPException(
            422,
            f"Invalid video format '{ext or content_type}'. Allowed formats: MP4, WebM, MOV, MKV.",
        )

    storage = get_storage()

    # Remove previous video file if present
    if ep.video_key:
        storage.delete(ep.video_key)

    safe_name = filename.replace("/", "_").replace("\\", "_")
    key = f"videos/ep_{episode_id}_{safe_name}"

    storage.upload_file(key, file.file)

    ep.video_key = key
    db.commit()
    db.refresh(ep)

    return {
        "id": ep.id,
        "video_key": ep.video_key,
        "video_url": storage.get_url(ep.video_key),
    }


@router.delete("/admin/episodes/{episode_id}/video", status_code=204)
def delete_episode_video(
    episode_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_editor),
):
    ep = db.get(Episode, episode_id)
    if not ep:
        raise HTTPException(404, "Episode not found")

    if ep.video_key:
        get_storage().delete(ep.video_key)
        ep.video_key = None
        db.commit()
