import os
import sqlite3
from PIL import Image, ImageDraw

SHOWS = [
    (1, "Moti's Many Lives", ["POSTER", "BANNER"], (230, 126, 34)),
    (3, "Discover India with Moti", ["POSTER", "BANNER", "THUMBNAIL"], (231, 76, 60)),
    (6, "Curious Cubs", ["POSTER", "BANNER", "THUMBNAIL"], (211, 84, 0)),
]

SPECS = {
    "POSTER": (600, 900),
    "BANNER": (1280, 720),
    "THUMBNAIL": (640, 360),
}

storage_root = os.path.join(os.path.dirname(__file__), "..", "data", "storage")
db_path = os.path.join(os.path.dirname(__file__), "..", "peblo.db")

conn = sqlite3.connect(db_path)
c = conn.cursor()

added = 0
for show_id, title, types, color in SHOWS:
    for atype in types:
        w, h = SPECS[atype]
        img = Image.new("RGB", (w, h), color=color)
        draw = ImageDraw.Draw(img)
        label = f"{title}\n[{atype}]"
        draw.text((w // 2, h // 2), label, fill=(255, 255, 255), anchor="mm")

        key = f"artwork/{atype.lower()}/show_{show_id}_{atype.lower()}.jpg"
        full_path = os.path.join(storage_root, key)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        img.save(full_path, "JPEG", quality=85)
        file_size = os.path.getsize(full_path)

        c.execute(
            """
            INSERT INTO artworks (show_id, type, storage_key, width, height, mime_type, file_size)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
            (show_id, atype, key, w, h, "image/jpeg", file_size),
        )
        added += 1
        print(f"Added {atype} for Show {show_id} ({title}) -> {key} ({file_size} bytes)")

conn.commit()
conn.close()
print(f"Successfully added {added} artworks to database and storage.")
