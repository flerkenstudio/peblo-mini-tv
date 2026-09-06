import typing
from abc import ABC, abstractmethod


class StorageBackend(ABC):
    @abstractmethod
    def upload(self, key: str, data: bytes) -> None: ...

    @abstractmethod
    def upload_file(self, key: str, file_obj: typing.BinaryIO) -> None: ...

    @abstractmethod
    def delete(self, key: str) -> None: ...

    @abstractmethod
    def exists(self, key: str) -> bool: ...

    @abstractmethod
    def get_url(self, key: str) -> str: ...

    @abstractmethod
    def write_catalogue(self, json_bytes: bytes) -> None: ...

    @abstractmethod
    def read_catalogue(self) -> bytes | None: ...
