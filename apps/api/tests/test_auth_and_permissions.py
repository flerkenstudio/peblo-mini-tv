def test_login_bad_credentials(client):
    r = client.post("/auth/login", json={"email": "admin@t.tv", "password": "wrong"})
    assert r.status_code == 401


def test_login_success_and_me(client, admin):
    r = client.get("/auth/me", headers=admin)
    assert r.status_code == 200
    assert r.json()["role"] == "admin"


def test_editor_can_publish(client, editor):
    r = client.post("/admin/catalog/publish", headers=editor)
    assert r.status_code in (200, 422)


def test_anon_cannot_create_show(client):
    assert client.post("/admin/shows", json={"title": "X"}).status_code == 403


def test_anon_cannot_list_shows(client, editor):
    # Admin endpoints require authentication; anonymous reads must be blocked.
    assert client.get("/admin/shows").status_code == 403
    r = client.get("/admin/shows", headers=editor)
    assert r.status_code == 200


def test_admin_can_hit_publish_endpoint(client, admin):
    r = client.post("/admin/catalog/publish", headers=admin)
    assert r.status_code in (200, 422)
