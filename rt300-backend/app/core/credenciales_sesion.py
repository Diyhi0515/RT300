"""Credenciales SOAP efímeras, solo en RAM y separadas de JWT/cookies/logs."""
from __future__ import annotations

import secrets
import threading
import time


class CredencialesSesion:
    def __init__(self) -> None:
        self._datos: dict[str, tuple[str, float]] = {}
        self._lock = threading.Lock()

    def guardar(self, clave: str, ttl_seconds: float) -> str:
        sid = secrets.token_urlsafe(32)
        with self._lock:
            self._limpiar()
            self._datos[sid] = (clave, time.time() + max(1, ttl_seconds))
        return sid

    def obtener(self, sid: str) -> str | None:
        if not sid:
            return None
        with self._lock:
            self._limpiar()
            dato = self._datos.get(sid)
            return dato[0] if dato else None

    def renovar(self, sid: str, ttl_seconds: float) -> bool:
        with self._lock:
            self._limpiar()
            dato = self._datos.get(sid)
            if not dato:
                return False
            self._datos[sid] = (dato[0], time.time() + max(1, ttl_seconds))
            return True

    def eliminar(self, sid: str) -> None:
        if sid:
            with self._lock:
                self._datos.pop(sid, None)

    def _limpiar(self) -> None:
        ahora = time.time()
        for sid in [sid for sid, (_, exp) in self._datos.items() if exp < ahora]:
            del self._datos[sid]


credenciales_sesion = CredencialesSesion()
