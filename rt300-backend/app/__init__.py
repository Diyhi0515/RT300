"""Application factory del backend RT-300."""
from __future__ import annotations

from flask import Flask, jsonify
from sqlalchemy import text

from .config import Config
from .core.db import get_db, init_db
from .core.error_handlers import register_error_handlers
from .core.logging import init_logging
from .core.respuesta import responder
from .core.salidas_comunes import SaludOut
from .extensions import cors, esta_revocado, jwt, limiter


def create_app(config: Config | None = None) -> Flask:
    cfg = config or Config()
    cfg.validate()

    app = Flask(__name__)
    app.config.update(
        APP_CONFIG=cfg,
        SECRET_KEY=cfg.secret_key,
        JWT_SECRET_KEY=cfg.jwt_secret_key,
        JWT_ACCESS_TOKEN_EXPIRES=cfg.jwt_access_ttl,
        JWT_REFRESH_TOKEN_EXPIRES=cfg.jwt_refresh_ttl,
        MAX_CONTENT_LENGTH=1 * 1024 * 1024,  # 1 MB: evita cuerpos gigantes
        JSON_AS_ASCII=False,
        JSON_SORT_KEYS=False,
    )

    init_logging(app)
    cors.init_app(app, resources={r"/api/*": {"origins": list(cfg.cors_origins)}})
    jwt.init_app(app)
    limiter.init_app(app)
    init_db(app, cfg)
    register_error_handlers(app)
    _register_jwt_errors()

    from .integrations.comandas.factory import build_gateway
    from .modules.auth.routes import bp as auth_bp
    from .modules.clientes.routes import bp as clientes_bp
    from .modules.comandas.routes import bp as comandas_bp
    from .modules.cuentas.routes import bp as cuentas_bp
    from .modules.menu.routes import bp as menu_bp
    from .modules.salon.routes import bp as salon_bp

    app.extensions["comandas_gateway"] = build_gateway(cfg)
    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(salon_bp, url_prefix="/api/v1/salon")
    app.register_blueprint(menu_bp, url_prefix="/api/v1/menu")
    app.register_blueprint(clientes_bp, url_prefix="/api/v1")
    app.register_blueprint(comandas_bp, url_prefix="/api/v1")
    app.register_blueprint(cuentas_bp, url_prefix="/api/v1")

    @app.get("/api/v1/health")
    def health():
        """Liveness + conectividad con la BD (SELECT 1)."""
        db_ok = True
        try:
            get_db().execute(text("SELECT 1"))
        except Exception:  # noqa: BLE001 - se reporta como estado, el detalle va al log
            app.logger.exception("health: fallo de BD")
            db_ok = False
        return responder(SaludOut, {"status": "ok" if db_ok else "degraded", "db": db_ok}, 200 if db_ok else 503)

    return app


def _register_jwt_errors() -> None:
    def _err(code: str, msg: str, status: int):
        return jsonify({"error": {"code": code, "message": msg}}), status

    jwt.token_in_blocklist_loader(lambda h, p: esta_revocado(p["jti"]))
    jwt.revoked_token_loader(lambda h, p: _err("TOKEN_REVOCADO", "Sesión cerrada.", 401))
    jwt.unauthorized_loader(lambda r: _err("NO_AUTENTICADO", "Falta el token de acceso.", 401))
    jwt.invalid_token_loader(lambda r: _err("TOKEN_INVALIDO", "Token inválido.", 401))
    jwt.expired_token_loader(lambda h, p: _err("TOKEN_EXPIRADO", "La sesión expiró.", 401))
