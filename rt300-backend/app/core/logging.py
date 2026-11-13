import contextlib
import json
import logging
import re
import sys
import uuid

from flask import Flask, g, request

_ID_VALIDO = re.compile(r"^[A-Za-z0-9._-]{1,64}$")


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        data = {"level": record.levelname, "logger": record.name, "msg": record.getMessage()}
        with contextlib.suppress(RuntimeError, AttributeError):  # fuera de una petición no hay request_id
            data["request_id"] = g.request_id
        if record.exc_info:
            data["exc"] = self.formatException(record.exc_info)
        return json.dumps(data, ensure_ascii=False)


def init_logging(app: Flask) -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(logging.DEBUG if app.config["APP_CONFIG"].is_dev else logging.INFO)
    logging.getLogger("werkzeug").setLevel(logging.WARNING)

    @app.before_request
    def _request_id():
        recibido = request.headers.get("X-Request-ID", "")
        g.request_id = recibido if _ID_VALIDO.match(recibido) else uuid.uuid4().hex[:12]

    @app.after_request
    def _echo_request_id(resp):
        resp.headers["X-Request-ID"] = getattr(g, "request_id", "")
        return resp
