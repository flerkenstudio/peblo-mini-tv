import io


def _setup_episode(client, editor):
    sid = client.post(
        "/admin/shows",
        json={"title": "Video Show", "section": "series", "category": "adventure", "status": "published"},
        headers=editor,
    ).json()["id"]
    season_id = client.post(
        f"/admin/shows/{sid}/seasons", json={"season_number": 1}, headers=editor
    ).json()["id"]
    ep_id = client.post(
        f"/admin/seasons/{season_id}/episodes",
        json={
            "title": "Episode 1",
            "content_group": "v1",
            "language": "en",
            "episode_number": 1,
            "duration_seconds": 300,
            "status": "published",
        },
        headers=editor,
    ).json()["id"]
    return season_id, ep_id


def test_episode_video_upload_and_delete(client, editor):
    season_id, ep_id = _setup_episode(client, editor)

    # Mock MP4 video file
    video_bytes = b"\x00\x00\x00 ftypisom\x00\x00\x02\x00isomiso2mp41\x00\x00\x00\x08free"
    files = {"file": ("episode_1.mp4", io.BytesIO(video_bytes), "video/mp4")}

    r = client.post(f"/admin/episodes/{ep_id}/video", files=files, headers=editor)
    assert r.status_code == 200
    data = r.json()
    assert data["video_key"].startswith(f"videos/ep_{ep_id}_")
    assert "/storage/videos/" in data["video_url"]

    # Verify listing episodes returns video_url
    r_list = client.get(f"/admin/seasons/{season_id}/episodes", headers=editor)
    assert r_list.status_code == 200
    eps = r_list.json()
    assert len(eps) == 1
    assert eps[0]["video_url"] == data["video_url"]

    # Delete video
    r_del = client.delete(f"/admin/episodes/{ep_id}/video", headers=editor)
    assert r_del.status_code == 204

    # Verify listing again shows video_url is null
    r_list2 = client.get(f"/admin/seasons/{season_id}/episodes", headers=editor)
    assert r_list2.status_code == 200
    assert r_list2.json()[0]["video_url"] is None


def test_episode_video_invalid_format_rejected(client, editor):
    _, ep_id = _setup_episode(client, editor)
    bad_file = {"file": ("bad.txt", io.BytesIO(b"not a video"), "text/plain")}
    r = client.post(f"/admin/episodes/{ep_id}/video", files=bad_file, headers=editor)
    assert r.status_code == 422


def test_anon_cannot_upload_video(client, editor):
    _, ep_id = _setup_episode(client, editor)
    files = {"file": ("ep.mp4", io.BytesIO(b"fake"), "video/mp4")}
    r = client.post(f"/admin/episodes/{ep_id}/video", files=files)
    assert r.status_code == 403
