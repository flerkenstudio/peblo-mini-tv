from dataclasses import dataclass

from sqlalchemy.orm import Session, joinedload

from app.db.models.models import Show, Season


@dataclass
class Blocker:
    code: str
    group: str
    subject: str
    problem: str
    fix: str


def build_report(db: Session) -> dict:
    blockers: list[Blocker] = []

    shows = (
        db.query(Show)
        .options(joinedload(Show.seasons).joinedload(Season.episodes), joinedload(Show.artworks))
        .all()
    )

    for show in shows:
        if show.status == "published" and not show.section:
            blockers.append(
                Blocker(
                    f"SHOW-{show.id:03d}",
                    "Shows",
                    f'Show "{show.title}"',
                    "Published show has no section.",
                    "Select a section before publishing.",
                )
            )

        all_eps = [e for s in show.seasons for e in s.episodes]
        for ep in all_eps:
            if ep.status != "published":
                continue
            if not ep.duration_seconds:
                blockers.append(
                    Blocker(
                        f"EPISODE-{ep.id:03d}",
                        "Episodes",
                        f'Episode "{ep.title}"',
                        "Duration is missing.",
                        "Enter episode duration before publishing.",
                    )
                )

        if show.status == "published":
            types = {a.type for a in show.artworks}
            for t in ("POSTER", "BANNER", "THUMBNAIL"):
                if t not in types:
                    blockers.append(
                        Blocker(
                            f"ARTWORK-{t}-S{show.id}",
                            "Artwork",
                            f'Show "{show.title}" missing {t.lower()}',
                            f"{t} artwork is missing.",
                            f"Upload a {t.lower()} before publishing.",
                        )
                    )

    grouped: dict[str, list[dict]] = {}
    for b in blockers:
        grouped.setdefault(b.group, []).append(
            {"code": b.code, "subject": b.subject, "problem": b.problem, "fix": b.fix}
        )

    return {"ok": not blockers, "blocking_count": len(blockers), "groups": grouped}
