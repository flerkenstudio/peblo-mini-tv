from pydantic import BaseModel, ConfigDict


class ShowIn(BaseModel):
    title: str
    synopsis: str | None = None
    section: str | None = None
    category: str | None = None
    status: str = "draft"
    featured: bool = False


class ShowUpdate(BaseModel):
    title: str | None = None
    synopsis: str | None = None
    section: str | None = None
    category: str | None = None
    status: str | None = None
    featured: bool | None = None


class ShowOut(BaseModel):
    id: int
    title: str
    slug: str
    synopsis: str | None = None
    section: str | None = None
    category: str | None = None
    status: str
    featured: bool

    model_config = ConfigDict(from_attributes=True)


class SeasonIn(BaseModel):
    season_number: int
    title: str | None = None


class SeasonOut(BaseModel):
    id: int
    show_id: int
    season_number: int
    title: str | None = None

    model_config = ConfigDict(from_attributes=True)


class EpisodeIn(BaseModel):
    title: str
    description: str | None = None
    duration_seconds: int | None = None
    content_group: str | int
    language: str
    episode_number: int
    status: str = "draft"


class EpisodeUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    duration_seconds: int | None = None
    episode_number: int | None = None
    status: str | None = None


class EpisodeOut(BaseModel):
    id: int
    season_id: int
    title: str
    description: str | None = None
    duration_seconds: int | None = None
    content_group: str | int
    language: str
    episode_number: int
    status: str
    video_key: str | None = None

    model_config = ConfigDict(from_attributes=True)
