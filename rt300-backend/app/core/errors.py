"""Errores de dominio: el handler global los traduce a JSON uniforme."""


class DomainError(Exception):
    status = 400
    code = "ERROR_DE_DOMINIO"

    def __init__(self, message: str, code: str | None = None):
        super().__init__(message)
        self.message = message
        if code:
            self.code = code


class ValidationFailed(DomainError):
    status, code = 422, "VALIDACION"


class Unauthorized(DomainError):
    status, code = 401, "CREDENCIALES_INVALIDAS"


class Forbidden(DomainError):
    status, code = 403, "SIN_PERMISO"


class NotFound(DomainError):
    status, code = 404, "NO_ENCONTRADO"


class Conflict(DomainError):
    status, code = 409, "CONFLICTO"


class GatewayError(DomainError):
    status, code = 502, "GATEWAY_UNAVAILABLE"
