import json
import os
import sys
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "apps", "api"))

from app.db.database import SessionLocal, engine, Base  # noqa: E402
import app.db.models.models as m  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.core.config import settings  # noqa: E402

# Drop and recreate tables for clean schema updates
Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)
db = SessionLocal()

# Seed Users
db.add(
    m.User(
        email="admin@peblo.tv",
        password_hash=hash_password("admin123"),
        role="admin",
    )
)
db.add(
    m.User(
        email="editor@peblo.tv",
        password_hash=hash_password("editor123"),
        role="editor",
    )
)
db.commit()
print("Users created: admin@peblo.tv/admin123, editor@peblo.tv/editor123")

seed_file = os.path.join(os.path.dirname(__file__), "..", "data", "seed", "seed_shows.json")
SHOW_COLORS = {
    "Moti's Many Lives": (230, 126, 34),
    "Tiny Tales by Banyan Dadi": (39, 174, 96),
    "Discover India with Moti": (231, 76, 60),
    "Peblo Songs": (142, 68, 173),
    "Peblo Songs — Lyrical": (41, 128, 185),
    "Curious Cubs": (211, 84, 0),
    "Number Nest": (192, 57, 43),
    "Rhyme Rangers": (52, 73, 94),
}

def generate_artwork(show_id: int, show_title: str, atype: str, bg_color: tuple):
    specs = {
        "POSTER": (600, 900),
        "BANNER": (1280, 720),
        "THUMBNAIL": (640, 360)
    }
    w, h = specs[atype]
    img = Image.new("RGB", (w, h), color=bg_color)
    draw = ImageDraw.Draw(img)
    label = f"{show_title}\n[{atype}]"
    draw.text((w // 2, h // 2), label, fill=(255, 255, 255), anchor="mm")

    key = f"artwork/{atype.lower()}/show_{show_id}_{atype.lower()}.jpg"
    final_path = os.path.join(settings.STORAGE_ROOT, key)
    os.makedirs(os.path.dirname(final_path), exist_ok=True)
    img.save(final_path, "JPEG", quality=85)
    file_size = os.path.getsize(final_path)

    return m.Artwork(
        show_id=show_id,
        type=atype,
        storage_key=key,
        width=w,
        height=h,
        mime_type="image/jpeg",
        file_size=file_size
    )

if os.path.exists(seed_file):
    data = json.load(open(seed_file, encoding="utf-8"))
    shows = data.get("shows", data if isinstance(data, list) else [])
    for s in shows:
        show = m.Show(
            title=s["title"],
            slug=s.get("slug", s["title"].lower().replace(" ", "-")),
            synopsis=s.get("synopsis"),
            section=s.get("section"),
            category=s.get("category"),
            status=s.get("status", "draft"),
            featured=s.get("featured", False),
        )
        db.add(show)
        db.flush()

        # Add artwork for shows (POSTER, BANNER, THUMBNAIL)
        color = SHOW_COLORS.get(s["title"], (70, 80, 95))
        for atype in ("POSTER", "BANNER", "THUMBNAIL"):
            art = generate_artwork(show.id, show.title, atype, color)
            db.add(art)

        for sn in s.get("seasons", []):
            season = m.Season(
                show_id=show.id,
                season_number=sn["season_number"],
                title=sn.get("title"),
            )
            db.add(season)
            db.flush()
            for ep in sn.get("episodes", []):
                db.add(
                    m.Episode(
                        season_id=season.id,
                        title=ep["title"],
                        description=ep.get("description"),
                        duration_seconds=ep.get("duration_seconds"),
                        content_group=str(ep["content_group"]),
                        language=ep["language"],
                        episode_number=ep["episode_number"],
                        status=ep.get("status", "draft"),
                    )
                )
    db.commit()
    print(f"Imported {len(shows)} seed shows with complete seasons, episodes, and generated artwork.")
else:
    print("No seed file found.")

db.close()
