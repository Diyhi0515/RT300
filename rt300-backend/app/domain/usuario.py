from __future__ import annotations

from dataclasses import asdict, dataclass

ROLES = ("garzon", "cajero", "admin")


@dataclass(frozen=True)
class Usuario:
    usuario: str
    nombre: str
    cloc: int   # local
    calm: int   # almacén
    cmon: int   # moneda de venta
    nreg: int   # registradora
    rol: str
    cven: int = 0   # código de mesero en la agenda (gbage); 0 si el usuario no tiene

    def claims(self) -> dict:
        """Lo que viaja en el JWT (nunca la clave)."""
        return asdict(self)

    @classmethod
    def desde_claims(cls, c: dict) -> Usuario:
        return cls(
            usuario=c["usuario"], nombre=c.get("nombre", ""), cloc=int(c["cloc"]), calm=int(c["calm"]),
            cmon=int(c["cmon"]), nreg=int(c.get("nreg") or 0), rol=c.get("rol", "garzon"), cven=int(c.get("cven") or 0),
        )
