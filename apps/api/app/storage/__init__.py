from app.core.config import settings
from .base import StorageBackend
from .local import LocalStorage


def get_storage() -> StorageBackend:
    """Return the configured storage backend."""
    if settings.STORAGE_BACKEND == "local":
        return LocalStorage()
    raise ValueError(f"Unknown storage backend: {settings.STORAGE_BACKEND}")
