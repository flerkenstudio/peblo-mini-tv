from datetime import datetime

from sqlalchemy import (
    String,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20))  # editor | admin
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Show(Base):
    __tablename__ = "shows"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(255), unique=True)
    synopsis: Mapped[str | None] = mapped_column(Text, nullable=True)
    section: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)  # draft | published
    featured: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    seasons: Mapped[list["Season"]] = relationship(
        back_populates="show", cascade="all, delete-orphan"
    )
    artworks: Mapped[list["Artwork"]] = relationship(
        back_populates="show", cascade="all, delete-orphan"
    )


class Season(Base):
    __tablename__ = "seasons"

    id: Mapped[int] = mapped_column(primary_key=True)
    show_id: Mapped[int] = mapped_column(ForeignKey("shows.id"), index=True)
    season_number: Mapped[int] = mapped_column(Integer)  # 0 = trailers
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)

    show: Mapped["Show"] = relationship(back_populates="seasons")
    episodes: Mapped[list["Episode"]] = relationship(
        back_populates="season", cascade="all, delete-orphan"
    )


class Episode(Base):
    __tablename__ = "episodes"

    id: Mapped[int] = mapped_column(primary_key=True)
    season_id: Mapped[int] = mapped_column(ForeignKey("seasons.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    content_group: Mapped[str] = mapped_column(String(100))
    language: Mapped[str] = mapped_column(String(50))
    episode_number: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    season: Mapped["Season"] = relationship(back_populates="episodes")
    artworks: Mapped[list["Artwork"]] = relationship(
        back_populates="episode", cascade="all, delete-orphan"
    )


class Artwork(Base):
    __tablename__ = "artworks"

    id: Mapped[int] = mapped_column(primary_key=True)
    show_id: Mapped[int | None] = mapped_column(ForeignKey("shows.id"), nullable=True, index=True)
    episode_id: Mapped[int | None] = mapped_column(ForeignKey("episodes.id"), nullable=True, index=True)
    type: Mapped[str] = mapped_column(String(20))  # POSTER | BANNER | THUMBNAIL
    storage_key: Mapped[str] = mapped_column(String(500))
    width: Mapped[int] = mapped_column(Integer)
    height: Mapped[int] = mapped_column(Integer)
    mime_type: Mapped[str] = mapped_column(String(100))
    file_size: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    show: Mapped["Show | None"] = relationship(back_populates="artworks")
    episode: Mapped["Episode | None"] = relationship(back_populates="artworks")


class PublishRun(Base):
    __tablename__ = "publish_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    triggered_by: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(20))  # success | failed
    published_show_count: Mapped[int] = mapped_column(Integer, default=0)
    published_episode_count: Mapped[int] = mapped_column(Integer, default=0)
    catalogue_version: Mapped[str | None] = mapped_column(String(100), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
