import io

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from PIL import Image
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models.models import Artwork
from app.core.dependencies import require_editor
from app.storage import get_storage

router = APIRouter(prefix="/admin/artworks", tags=["artwork"])

SPECS = {
    "POSTER": {"ratio": (2, 3), "w": 600, "h": 900},
    "BANNER": {"ratio": (16, 9), "w": 1280, "h": 720},
    "THUMBNAIL": {"ratio": (16, 9), "w": 640, "h": 360},
}
MAX_SIZE = 200 * 1024  # 200 KB
TOLERANCE = 0.02


def validate_image(img: Image.Image, file_size: int, atype: str):
    spec = SPECS[atype]
    w, h = img.size
    if file_size > MAX_SIZE:
        raise HTTPException(
            422,
            f"ARTWORK-001: File is {file_size // 1024} KB. Max allowed is 200 KB. "
            f"Fix: compress the image.",
        )
    target = spec["ratio"][0] / spec["ratio"][1]
    actual = w / h
    if abs(target - actual) / target > TOLERANCE:
        raise HTTPException(
            422,
            f"ARTWORK-003: Image dimensions are {w} x {h}. "
            f"Required ratio: {spec['ratio'][0]}:{spec['ratio'][1]}. "
            f"Fix: upload a {'portrait ' if atype == 'POSTER' else ''}image at ~{spec['w']}x{spec['h']}.",
        )


@router.get("")
def list_artworks(
    show_id: int | None = None,
    db: Session = Depends(get_db),
    user=Depends(require_editor),
):
    q = db.query(Artwork)
    if show_id:
        q = q.filter(Artwork.show_id == show_id)
    storage = get_storage()
    return [
        {
            "id": a.id,
            "type": a.type,
            "url": storage.get_url(a.storage_key),
            "width": a.width,
            "height": a.height,
            "file_size": a.file_size,
        }
        for a in q.all()
    ]


@router.post("", status_code=201)
def upload_artwork(
    type: str = Form(...),
    show_id: int | None = Form(None),
    episode_id: int | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(require_editor),
):
    atype = type.upper()
    if atype not in SPECS:
        raise HTTPException(422, "type must be POSTER, BANNER or THUMBNAIL")
    if not show_id and not episode_id:
        raise HTTPException(422, "show_id or episode_id required")

    data = file.file.read()
    try:
        img = Image.open(io.BytesIO(data))
        img.verify()
        img = Image.open(io.BytesIO(data))  # re-open: verify() consumes the parser
        img.load()
    except Exception:
        raise HTTPException(
            422, "ARTWORK-002: File is not a valid image. Fix: upload a PNG or JPEG."
        )

    validate_image(img, len(data), atype)

    subject_id = show_id if show_id else episode_id
    subject_kind = "show" if show_id else "episode"
    safe_name = (file.filename or "upload").replace("/", "_")
    key = f"artwork/{atype.lower()}/{subject_kind}_{subject_id}_{safe_name}"

    storage = get_storage()
    storage.upload(key, data)

    art = Artwork(
        type=atype,
        show_id=show_id,
        episode_id=episode_id,
        storage_key=key,
        width=img.size[0],
        height=img.size[1],
        mime_type=img.format or "UNKNOWN",
        file_size=len(data),
    )
    db.add(art)
    db.commit()
    db.refresh(art)

    return {
        "id": art.id,
        "type": art.type,
        "storage_key": art.storage_key,
        "url": storage.get_url(key),
        "width": art.width,
        "height": art.height,
    }


@router.delete("/{artwork_id}", status_code=204)
def delete_artwork(
    artwork_id: int, db: Session = Depends(get_db), user=Depends(require_editor)
):
    art = db.get(Artwork, artwork_id)
    if not art:
        raise HTTPException(404, "Artwork not found")
    get_storage().delete(art.storage_key)
    db.delete(art)
    db.commit()
