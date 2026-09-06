import os
from pydantic_settings import BaseSettings, SettingsConfigDict

_root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./peblo.db"
    JWT_SECRET: str = "dev-secret"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    STORAGE_BACKEND: str = "local"
    STORAGE_ROOT: str = "./data/storage"
    CATALOGUE_PATH: str = "./data/storage/catalogue.json"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174"

    model_config = SettingsConfigDict(env_file=(_root_env, ".env"), extra="ignore")


settings = Settings()
