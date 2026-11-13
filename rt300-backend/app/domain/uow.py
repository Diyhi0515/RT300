"""Unidad de trabajo: `with uow:` confirma al salir bien y deshace ante cualquier excepción."""
from __future__ import annotations

from typing import Protocol


class UnitOfWork(Protocol):
    def __enter__(self) -> UnitOfWork: ...
    def __exit__(self, exc_type, exc, tb) -> bool: ...
