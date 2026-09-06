from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import settings

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def init_db():
    Base.metadata.create_all(engine)
    # Ensure newly added columns exist on pre-existing databases
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE episodes ADD COLUMN video_key VARCHAR(500)"))
            conn.commit()
        except Exception:
            pass

    # Ensure default users exist (admin, editor, viewer)
    try:
        from app.db.models.models import User
        from app.core.security import hash_password
        db = SessionLocal()
        default_users = [
            ("admin@peblo.tv", "admin123", "admin"),
            ("editor@peblo.tv", "editor123", "editor"),
            ("viewer@peblo.tv", "viewer123", "viewer"),
        ]
        for email, password, role in default_users:
            if not db.query(User).filter(User.email == email).first():
                db.add(User(email=email, password_hash=hash_password(password), role=role))
        db.commit()
        db.close()
    except Exception:
        pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

