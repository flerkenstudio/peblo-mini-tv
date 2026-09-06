import os
import shutil
import tempfile
import typing

from app.storage.base import StorageBackend
from app.core.config import settings


class LocalStorage(StorageBackend):
    def __init__(self):
        self.root = settings.STORAGE_ROOT
        os.makedirs(self.root, exist_ok=True)

    def _path(self, key: str) -> str:
        return os.path.join(self.root, key.lstrip("/"))

    def upload(self, key: str, data: bytes) -> None:
        p = self._path(key)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "wb") as f:
            f.write(data)

    def upload_file(self, key: str, file_obj: typing.BinaryIO) -> None:
        p = self._path(key)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "wb") as f:
            shutil.copyfileobj(file_obj, f)

    def delete(self, key: str) -> None:
        p = self._path(key)
        if os.path.exists(p):
            os.remove(p)

    def exists(self, key: str) -> bool:
        return os.path.exists(self._path(key))

    def get_url(self, key: str) -> str:
        return f"/storage/{key}"

    def write_catalogue(self, json_bytes: bytes) -> None:
        # Atomic write: temp file in same dir, flush, fsync, then rename.
        final = self._path("catalogue.json")
        os.makedirs(os.path.dirname(final) or self.root, exist_ok=True)
        fd, tmp = tempfile.mkstemp(dir=self.root)
        with os.fdopen(fd, "wb") as f:
            f.write(json_bytes)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, final)  # atomic on POSIX

    def read_catalogue(self) -> bytes | None:
        p = self._path("catalogue.json")
        if os.path.exists(p):
            with open(p, "rb") as f:
                return f.read()
        return None
