from pydantic import BaseModel, Field

from ...core.respuesta import Salida


class ActualizarCuentaIn(BaseModel):
    mesa: str = Field(min_length=1, max_length=20)
    cage: int = Field(ge=0, description="Código de cliente en la agenda")
    nruc: str = Field(default="", max_length=20)
    nomb: str = Field(default="", max_length=80)


# ───────────── Salida ─────────────
class CuentaClienteOut(Salida):
    nfol: int
    ncta: int
    nombre: str | None = None
    nruc: str | int | None = None
    ndid: str | int | None = None
    cage: int | str | None = None
    cliente: str


class CuentasClienteOut(Salida):
    cuentas: list[CuentaClienteOut]


class ClienteOut(Salida):
    codigo: int
    nombre: str | None = None
    nruc: str | int | None = None


class ClientesOut(Salida):
    clientes: list[ClienteOut]


class ClienteDetalleOut(ClienteOut):
    ndid: str | int | None = None
    lpre: int | None = None   # lista de precio del cliente (la usa la toma de pedido)


class ClientesDetalleOut(Salida):
    clientes: list[ClienteDetalleOut]
