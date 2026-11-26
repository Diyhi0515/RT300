"""Nombre del negocio: el que puso el administrador en la app; si no puso ninguno, el de la base (gbpmt)."""
from __future__ import annotations

import sqlite3

from ...core.acceso import exigir_rol
from ...core.errors import ServicioNoDisponible
from ...domain.usuario import Usuario
from .ports import AjustesApp, NegocioRepo

_CLAVE = "nombre_negocio"


class NegocioService:
    def __init__(self, repo: NegocioRepo, ajustes: AjustesApp):
        self._repo, self._ajustes = repo, ajustes

    def nombre(self) -> str | None:
        return self._ajustes.leer(_CLAVE) or self._repo.nombre()

    def detalle(self, u: Usuario) -> dict:
        exigir_rol(u, "admin")
        propio, base = self._ajustes.leer(_CLAVE), self._repo.nombre()
        return {"nombre": propio or base, "nombre_base": base, "personalizado": bool(propio)}

    def cambiar_nombre(self, u: Usuario, nombre: str) -> dict:
        """Un texto vacío quita el nombre propio y vuelve a usarse el de la base."""
        exigir_rol(u, "admin")
        try:
            self._ajustes.guardar(_CLAVE, nombre.strip() or None)
        except (OSError, sqlite3.Error) as error:
            raise ServicioNoDisponible("No se pudo guardar el nombre en el servidor.", "AJUSTES_NO_DISPONIBLES") from error
        return self.detalle(u)
