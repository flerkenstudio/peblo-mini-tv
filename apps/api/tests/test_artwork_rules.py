import io

from PIL import Image


def _file(size):
    buf = io.BytesIO()
    Image.new("RGB", size).save(buf, "JPEG", quality=85)
    buf.seek(0)
    return {"file": ("a.jpg", buf, "image/jpeg")}


def _mkshow(client, editor):
    return client.post("/admin/shows", json={"title": "T"}, headers=editor).json()["id"]


def test_wrong_ratio_rejected(client, editor):
    sid = _mkshow(client, editor)
    r = client.post(
        "/admin/artworks",
        headers=editor,
        data={"type": "POSTER", "show_id": str(sid)},
        files=_file((500, 500)),
    )
    assert r.status_code == 422
    assert "ARTWORK-003" in r.json()["detail"]


def test_wrong_type_rejected(client, editor):
    sid = _mkshow(client, editor)
    r = client.post(
        "/admin/artworks",
        headers=editor,
        data={"type": "POSTER", "show_id": str(sid)},
        files={"file": ("a.txt", io.BytesIO(b"hello"), "text/plain")},
    )
    assert r.status_code == 422
    assert "ARTWORK-002" in r.json()["detail"]


def test_valid_poster_accepted(client, editor):
    sid = _mkshow(client, editor)
    r = client.post(
        "/admin/artworks",
        headers=editor,
        data={"type": "POSTER", "show_id": str(sid)},
        files=_file((600, 900)),
    )
    assert r.status_code == 201


def test_missing_show_and_episode_id_rejected(client, editor):
    r = client.post(
        "/admin/artworks",
        headers=editor,
        data={"type": "POSTER"},
        files=_file((600, 900)),
    )
    assert r.status_code == 422


def test_anon_cannot_upload_artwork(client):
    sid_resp = client.post("/admin/shows", json={"title": "NoAuth"})
    assert sid_resp.status_code == 403
