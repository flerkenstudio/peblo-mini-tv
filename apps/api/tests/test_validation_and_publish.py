import io

from PIL import Image


def _published_setup(client, editor, *, missing=""):
    r = client.post(
        "/admin/shows",
        json={
            "title": "Dino World",
            "section": "Kids",
            "category": "Adventure",
            "status": "published",
        },
        headers=editor,
    )
    sid = r.json()["id"]
    season = client.post(
        f"/admin/shows/{sid}/seasons", json={"season_number": 1}, headers=editor
    ).json()
    ep = {
        "title": "Pilot",
        "content_group": 1001,
        "language": "English",
        "episode_number": 1,
        "status": "published",
    }
    if missing != "duration":
        ep["duration_seconds"] = 600
    client.post(f"/admin/seasons/{season['id']}/episodes", json=ep, headers=editor)
    client.patch(f"/admin/shows/{sid}", json={"featured": True}, headers=editor)
    return sid


def _upload_all_artwork(client, editor, sid):
    for t, size in (("POSTER", (600, 900)), ("BANNER", (1280, 720)), ("THUMBNAIL", (640, 360))):
        buf = io.BytesIO()
        Image.new("RGB", size).save(buf, "JPEG", quality=85)
        buf.seek(0)
        r = client.post(
            "/admin/artworks",
            headers=editor,
            data={"type": t, "show_id": str(sid)},
            files={"file": ("a.jpg", buf, "image/jpeg")},
        )
        assert r.status_code == 201, r.text


def test_blockers_prevent_publish(client, admin, editor):
    _published_setup(client, editor)  # artwork missing -> blocked
    r = client.post("/admin/catalog/publish", headers=admin)
    assert r.status_code == 422
    assert r.json()["detail"]["success"] is False


def test_missing_duration_blocks_publish(client, admin, editor):
    sid = _published_setup(client, editor, missing="duration")
    _upload_all_artwork(client, editor, sid)
    r = client.post("/admin/catalog/publish", headers=admin)
    assert r.status_code == 422
    groups = r.json()["detail"]["reason"]["groups"]
    assert "Episodes" in groups


def test_publish_success_and_idempotency(client, admin, editor):
    sid = _published_setup(client, editor)
    _upload_all_artwork(client, editor, sid)

    r1 = client.post("/admin/catalog/publish", headers=admin)
    assert r1.status_code == 200
    v1 = r1.json()["version"]

    r2 = client.post("/admin/catalog/publish", headers=admin)
    assert r2.json()["version"] == v1  # deterministic / idempotent

    cat = client.get("/catalog").json()
    assert cat["version"] == v1
    assert cat["sections"][0]["shows"][0]["title"] == "Dino World"


def test_season_zero_excluded_and_language_merge(client, admin, editor):
    sid = _published_setup(client, editor)
    seasons = client.get(f"/admin/shows/{sid}/seasons", headers=editor).json()
    season1_id = next(s["id"] for s in seasons if s["season_number"] == 1)

    trailer = client.post(
        f"/admin/shows/{sid}/seasons", json={"season_number": 0}, headers=editor
    ).json()
    client.post(
        f"/admin/seasons/{trailer['id']}/episodes",
        json={
            "title": "Trailer",
            "content_group": 0,
            "language": "English",
            "episode_number": 1,
            "status": "published",
            "duration_seconds": 60,
        },
        headers=editor,
    )

    # Same episode_number, different language -> should merge, not duplicate.
    client.post(
        f"/admin/seasons/{season1_id}/episodes",
        json={
            "title": "Pilot",
            "content_group": 1001,
            "language": "Hindi",
            "episode_number": 1,
            "status": "published",
            "duration_seconds": 600,
        },
        headers=editor,
    )

    _upload_all_artwork(client, editor, sid)
    client.post("/admin/catalog/publish", headers=admin)

    cat = client.get("/catalog").json()
    show = cat["sections"][0]["shows"][0]
    assert all(s["season_number"] != 0 for s in show["seasons"])
    ep1 = show["seasons"][0]["episodes"][0]
    assert set(ep1["languages"]) == {"English", "Hindi"}


def test_publish_requires_admin(client, editor):
    r = client.post("/admin/catalog/publish", headers=editor)
    assert r.status_code == 403
