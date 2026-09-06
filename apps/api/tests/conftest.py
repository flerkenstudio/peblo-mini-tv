import os
import shutil

os.environ["DATABASE_URL"] = "sqlite://"  # overridden by the in-memory engine below
os.environ["STORAGE_ROOT"] = "./test_storage"
os.environ["CATALOGUE_PATH"] = "./test_storage/catalogue.json"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.main import app  # noqa: E402
from app.db.database import Base, get_db  # noqa: E402
from app.db.models.models import User  # noqa: E402
from app.core.security import hash_password  # noqa: E402

# A single shared in-memory SQLite DB for the whole test session, reset
# (drop/create) between tests. StaticPool keeps the same connection alive
# instead of it vanishing after each use (the default sqlite in-memory
# behaviour would otherwise wipe the DB on every new connection).
test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)


def _override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture(autouse=True)
def setup():
    shutil.rmtree("./test_storage", ignore_errors=True)
    Base.metadata.create_all(test_engine)
    db = TestSessionLocal()
    db.add(User(email="admin@t.tv", password_hash=hash_password("apass"), role="admin"))
    db.add(User(email="ed@t.tv", password_hash=hash_password("epass"), role="editor"))
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(test_engine)
    shutil.rmtree("./test_storage", ignore_errors=True)


@pytest.fixture
def client():
    return TestClient(app)


def _token(client, email, pw):
    r = client.post("/auth/login", json={"email": email, "password": pw})
    return r.json()["access_token"]


@pytest.fixture
def admin(client):
    return {"Authorization": f"Bearer {_token(client, 'admin@t.tv', 'apass')}"}


@pytest.fixture
def editor(client):
    return {"Authorization": f"Bearer {_token(client, 'ed@t.tv', 'epass')}"}
