"""Control de acceso por local: un usuario solo opera mesas, folios y comandas de SU local.

Si el recurso no existe, la guardia no interviene (el caso de uso responde su propio "no existe").
"""
from __future__ import annotations

from ..domain.usuario import Usuario
from .errors import Forbidden


def exigir_local(u: Usuario, local_del_recurso: int | None) -> None:
    if local_del_recurso is not None and int(local_del_recurso) != u.cloc:
        raise Forbidden("El recurso pertenece a otro local.", "OTRO_LOCAL")
