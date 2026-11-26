from __future__ import annotations

from typing import Protocol


class NegocioRepo(Protocol):
    def nombre(self) -> str | None: ...


class AjustesApp(Protocol):
    """Ajustes propios de la aplicación: no se guardan en la base heredada."""

    def leer(self, clave: str) -> str | None: ...
    def guardar(self, clave: str, valor: str | None) -> None: ...
