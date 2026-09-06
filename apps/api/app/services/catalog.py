from collections import defaultdict
from datetime import datetime, timezone

from sqlalchemy.orm import Session, joinedload

from app.db.models.models import Show, Season
from app.storage import get_storage


def build_catalogue_dict(db: Session) -> dict:
    shows = (
        db.query(Show)
        .options(
            joinedload(Show.seasons).joinedload(Season.episodes),
            joinedload(Show.artworks),
        )
        .filter(Show.status == "published")
        .all()
    )

    storage = get_storage()
    sections: dict[str, list[dict]] = defaultdict(list)

    # Deterministic ordering: by section, then title, then id.
    for show in sorted(shows, key=lambda s: ((s.section or ""), s.title.lower(), s.id)):
        artwork = {a.type: a for a in show.artworks}

        seasons_out = []
        for season in sorted(show.seasons, key=lambda s: s.season_number):
            # Season 0 = trailers, never shown to the viewer.
            if season.season_number == 0:
                continue

            published_eps = [
                e for e in season.episodes if e.status == "published" and e.duration_seconds
            ]
            if not published_eps:
                continue

            # Group by episode_number, merging language variants deterministically.
            grouped: dict[int, dict] = {}
            for ep in sorted(published_eps, key=lambda e: e.episode_number):
                g = grouped.setdefault(
                    ep.episode_number,
                    {
                        "episode_number": ep.episode_number,
                        "title": ep.title,
                        "description": ep.description,
                        "duration_seconds": ep.duration_seconds,
                        "languages": [],
                    },
                )
                if ep.language not in g["languages"]:
                    g["languages"].append(ep.language)

            for g in grouped.values():
                g["languages"] = sorted(g["languages"])

            seasons_out.append(
                {
                    "season_number": season.season_number,
                    "episodes": [grouped[n] for n in sorted(grouped)],
                }
            )

        if not seasons_out:
            continue  # a published show needs at least one publishable season

        sections[show.section or "General"].append(
            {
                "id": show.id,
                "title": show.title,
                "slug": show.slug,
                "synopsis": show.synopsis,
                "category": show.category,
                "categories": [c.strip() for c in show.category.split(",") if c.strip()] if show.category else [],
                "poster": storage.get_url(artwork["POSTER"].storage_key) if "POSTER" in artwork else None,
                "banner": storage.get_url(artwork["BANNER"].storage_key) if "BANNER" in artwork else None,
                "thumbnail": storage.get_url(artwork["THUMBNAIL"].storage_key) if "THUMBNAIL" in artwork else None,
                "seasons": seasons_out,
            }
        )

    # Featured hero: featured + published show, deterministic fallback by id.
    featured_show = next(
        (s for s in sorted(shows, key=lambda s: s.id) if s.featured and s.status == "published"),
        None,
    )
    featured = None
    if featured_show:
        fa = {a.type: a for a in featured_show.artworks}
        featured = {
            "show_id": featured_show.id,
            "title": featured_show.title,
            "synopsis": featured_show.synopsis,
            "banner": storage.get_url(fa["BANNER"].storage_key) if "BANNER" in fa else None,
        }

    ordered_sections = [
        {"name": name, "shows": sections[name]} for name in sorted(sections)
    ]

    return {
        "version": None,  # filled in by the publisher with a deterministic checksum
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "featured": featured,
        "sections": ordered_sections,
    }
