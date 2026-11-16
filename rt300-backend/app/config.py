"""Configuración 100 % desde variables de entorno (12-factor)."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from datetime import timedelta


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


USUARIOS_DB_DE_DESARROLLO = frozenset({"sa", "prueba", "rt300_app_dev"})
CLAVES_DB_DE_DESARROLLO = frozenset({"", "prueba", "Rt300App2026x", "Rt300_Sa_2026!"})


@dataclass(frozen=True)
class Config:
    env: str = field(default_factory=lambda: _env("FLASK_ENV", "production"))
    secret_key: str = field(repr=False, default_factory=lambda: _env("SECRET_KEY", "dev-secret-cambiar"))
    jwt_secret_key: str = field(
        repr=False, default_factory=lambda: _env("JWT_SECRET_KEY", "dev-jwt-secret-cambiar-por-uno-largo-de-32-o-mas")
    )
    jwt_access_minutes: int = field(default_factory=lambda: int(_env("JWT_ACCESS_MINUTES", "15")))
    jwt_refresh_days: int = field(default_factory=lambda: int(_env("JWT_REFRESH_DAYS", "1")))
    cors_origins: tuple[str, ...] = field(
        default_factory=lambda: tuple(
            o.strip() for o in _env("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()
        )
    )

    db_driver: str = field(default_factory=lambda: _env("DB_DRIVER", "ODBC Driver 18 for SQL Server"))
    db_host: str = field(default_factory=lambda: _env("DB_HOST", "localhost"))
    db_port: int = field(default_factory=lambda: int(_env("DB_PORT", "1433")))
    db_name: str = field(default_factory=lambda: _env("DB_NAME", "tbpos_new"))
    db_user: str = field(default_factory=lambda: _env("DB_USER", ""))
    db_password: str = field(repr=False, default_factory=lambda: _env("DB_PASSWORD", ""))
    db_trust_cert: str = field(default_factory=lambda: _env("DB_TRUST_CERT", "yes"))

    gateway_mode: str = field(default_factory=lambda: _env("GATEWAY_MODE", "fake"))
    gateway_wsdl_url: str = field(default_factory=lambda: _env("GATEWAY_WSDL_URL"))
    gateway_http_url: str = field(default_factory=lambda: _env("GATEWAY_HTTP_URL"))
    gateway_dll_path: str = field(default_factory=lambda: _env("GATEWAY_DLL_PATH"))
    gateway_password: str = field(repr=False, default_factory=lambda: _env("GATEWAY_PASSWORD"))
    admin_users: tuple[str, ...] = field(
        default_factory=lambda: tuple(u.strip().upper() for u in _env("ADMIN_USERS").split(",") if u.strip())
    )
    cajero_users: tuple[str, ...] = field(
        default_factory=lambda: tuple(u.strip().upper() for u in _env("CAJERO_USERS").split(",") if u.strip())
    )
    menu_cache_seconds: int = field(default_factory=lambda: int(_env("MENU_CACHE_SECONDS", "300")))
    proxy_hops: int = field(default_factory=lambda: int(_env("PROXY_HOPS", "0")))
    rate_limit_default: str = field(default_factory=lambda: _env("RATE_LIMIT_DEFAULT", "300 per minute"))
    cookie_secure: str = field(default_factory=lambda: _env("COOKIE_SECURE", "").lower())
    revocados_db: str = field(default_factory=lambda: _env("REVOCADOS_DB", "data/revocados.sqlite"))
    redis_url: str = field(repr=False, default_factory=lambda: _env("REDIS_URL"))
    imagenes_dir: str = field(default_factory=lambda: _env("IMAGENES_DIR", "/data/imagenes"))
    imagenes_cache_dir: str = field(default_factory=lambda: _env("IMAGENES_CACHE_DIR", "/data/cache"))
    gateway_timeout_seconds: int = field(default_factory=lambda: int(_env("GATEWAY_TIMEOUT_SECONDS", "30")))

    @property
    def is_dev(self) -> bool:
        return self.env == "development"

    @property
    def cookie_segura(self) -> bool:
        """Por defecto la cookie exige HTTPS salvo en desarrollo; COOKIE_SECURE=true/false lo fuerza."""
        if self.cookie_secure in ("true", "1", "yes"):
            return True
        if self.cookie_secure in ("false", "0", "no"):
            return False
        return not self.is_dev

    @property
    def jwt_access_ttl(self) -> timedelta:
        return timedelta(minutes=self.jwt_access_minutes)

    @property
    def jwt_refresh_ttl(self) -> timedelta:
        return timedelta(days=self.jwt_refresh_days)

    def validate(self) -> None:
        """En producción se rechaza arrancar con credenciales o ajustes de desarrollo."""
        if self.is_dev:
            return
        problemas = []
        if "cambiar" in self.secret_key or "cambiar" in self.jwt_secret_key or len(self.jwt_secret_key) < 32:
            problemas.append("SECRET_KEY/JWT_SECRET_KEY inseguros: defina valores propios (JWT >= 32 caracteres)")
        if self.db_user.lower() in USUARIOS_DB_DE_DESARROLLO or self.db_password in CLAVES_DB_DE_DESARROLLO:
            problemas.append("DB_USER/DB_PASSWORD son de desarrollo: use un usuario propio con permisos mínimos")
        if not self.cors_origins or "*" in self.cors_origins:
            problemas.append("CORS_ORIGINS debe listar los orígenes permitidos (sin '*')")
        if problemas:
            raise RuntimeError("Configuración insegura para producción: " + "; ".join(problemas) + ".")
