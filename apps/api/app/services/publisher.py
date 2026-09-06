import hashlib
import json
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.db.models.models import PublishRun
from app.services.catalog import build_catalogue_dict
from app.services.validation import build_report
from app.storage import get_storage


def _checksum(payload: dict) -> str:
    # Exclude fields that legitimately vary run-to-run so identical underlying
    # data always produces the same version (deterministic + idempotent).
    stable = {k: v for k, v in payload.items() if k not in ("version", "generated_at")}
    content = json.dumps(stable, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(content.encode()).hexdigest()[:12]


def publish(db: Session, triggered_by: str) -> dict:
    run = PublishRun(
        triggered_by=triggered_by, status="failed", started_at=datetime.now(timezone.utc)
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    try:
        # 1. Validate first — invalid data must block publish.
        report = build_report(db)
        if not report["ok"]:
            run.error_message = f"{report['blocking_count']} blocking problems"
            db.commit()
            return {"success": False, "reason": report}

        # 2. Build catalogue JSON.
        payload = build_catalogue_dict(db)
        version = _checksum(payload)
        payload["version"] = version

        # 3. Shape sanity check.
        json.dumps(payload)  # raises if not serializable
        if not payload["sections"]:
            raise ValueError("Nothing publishable: no published shows with episodes")

        # 4. Atomic write (temp file -> flush -> os.replace, handled in LocalStorage).
        json_bytes = json.dumps(payload, indent=2).encode()
        get_storage().write_catalogue(json_bytes)

        # 5. Record success.
        ep_count = sum(
            len(s["episodes"])
            for sec in payload["sections"]
            for sh in sec["shows"]
            for s in sh["seasons"]
        )
        run.status = "success"
        run.completed_at = datetime.now(timezone.utc)
        run.published_show_count = sum(len(sec["shows"]) for sec in payload["sections"])
        run.published_episode_count = ep_count
        run.catalogue_version = version
        run.error_message = None
        db.commit()

        return {
            "success": True,
            "version": version,
            "shows": run.published_show_count,
            "episodes": ep_count,
        }

    except Exception as e:
        # The previous catalogue remains live — we never touch it before the atomic swap.
        run.status = "failed"
        run.completed_at = datetime.now(timezone.utc)
        run.error_message = str(e)
        db.commit()
        return {"success": False, "reason": str(e)}
