# rt300-backend

API REST del nuevo sistema **RT-300** (pedidos de restaurante) del Club de Campo. Reemplaza al backend PHP del proyecto `RT-300WEB`
**manteniendo la misma base de datos `tbpos_new`** (no se altera el esquema) y la misma lógica de negocio, con arquitectura limpia.

Stack: Python 3.13 · Flask 3 · Pydantic v2 · SQLAlchemy 2 (Core) + pyodbc (ODBC Driver 18) · Flask-JWT-Extended · Flask-Limiter · zeep (SOAP) · Pillow · pytest.

Documentación relacionada (en `../docs/`):

| Documento | Para qué |
|---|---|
| [00-arquitectura-general.md](../docs/00-arquitectura-general.md) | Objetivo, flujos, decisiones abiertas, hoja de ruta |
| [01-backend-flask.md](../docs/01-backend-flask.md) | Diseño detallado: capas, API, datos, gateway, pruebas, problemas del PHP |
| [03-puesta-en-marcha.md](../docs/03-puesta-en-marcha.md) | Cómo levantar todo con Docker |
| [CAMBIOS.md](../docs/CAMBIOS.md) | **Registro de cambios** del backend, el front y la BD |
| [bruno/](../docs/bruno/RT300.postman_collection.json) | Colección de 38 requests para Bruno/Postman |

## Arranque rápido

Desde la raíz del repositorio (requiere Docker Desktop y el `.bak` de la base en `docker/backup/`):

```bash
cp .env.example .env
docker compose up -d db               # SQL Server 2017
docker compose up db-init             # restaura tbpos_new (~28 min la primera vez) y crea los usuarios de BD
docker compose up -d --build backend
curl http://localhost:5000/api/v1/health      # {"db": true, "status": "ok"}
```

Usuario de prueba: `GP1` / `123456` (también `GP2`, `GP5`, `GP6`). Pruebas unitarias:

```bash
docker compose exec backend python -m pytest tests/unit      # 60 pruebas, sin base de datos
```

## Arquitectura en una mirada

```
routes ──► composition ──► services ──► ports (Protocol) ◄── repositories (SQL)
 HTTP       arma las          casos de      contratos            único lugar
            dependencias      uso           + dataclasses        con SQL
```

- `app/domain/`: núcleo sin Flask ni SQL (`Usuario`, `Mesa`, `UnitOfWork`).
- `app/modules/<dominio>/`: `auth`, `salon`, `clientes`, `menu`, `comandas`, `cuentas`. Cada uno con `ports.py`, `repository.py`, `service.py`, `schemas.py`, `routes.py`.
- `app/integrations/comandas/`: gateway al servicio de comandas, intercambiable por `GATEWAY_MODE` (`fake`, `soap`, `http`, `dll`).
- `app/composition.py`: único sitio donde se eligen las implementaciones concretas.
- `app/core/`: conexión, SQL parametrizado, errores, seguridad, logs, `respuesta.py` (respuestas tipadas) y `acceso.py` (acceso por local).

Cada endpoint responde con un **modelo de salida** Pydantic (`…Out` en `schemas.py`) mediante `responder(ModeloOut, datos)`: solo salen los campos
declarados, así que una columna nueva o personal de la base legacy no se filtra. Los tokens JWT los emite `modules/auth/tokens.py`, no la ruta.

Los servicios dependen de **abstracciones** (puertos), no de SQLAlchemy ni de Flask, por eso se prueban sin base de datos. Detalle en
[01-backend-flask.md §2](../docs/01-backend-flask.md).

## API

Prefijo `/api/v1`, JSON, `Authorization: Bearer <JWT>` salvo `/health`, `/auth/usuarios`, `/auth/login` y la imagen del plato.
37 endpoints; el listado completo con su equivalencia en el PHP está en [01-backend-flask.md §5](../docs/01-backend-flask.md).

| Módulo | Endpoints principales |
|---|---|
| `auth` | `GET /auth/usuarios` · `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` · `GET /auth/me` |
| `salon` | `GET /salon/parametros` · `GET /salon/areas/{caco}/mesas` · `GET /salon/mesas/{mesa}` · `POST /salon/mesas/{mesa}/ocupar` · `POST …/habilitar` · `PATCH /salon/folios/{nfol}` |
| `clientes` | `GET /folios/{nfol}/cuentas` · `GET /clientes` · `PUT /folios/{nfol}/cuentas/{ncta}` |
| `menu` | secciones, platos, extras, datos de plato/extra, insumos alternativos, textos, centros de producción, imagen |
| `comandas` | `POST /comandas` · `POST /comandas/{ntmp}/reintentar` · `GET /folios/{nfol}/comandas` · `POST /comandas/eliminar` · `POST /comandas/reimprimir` |
| `cuentas` | `GET …/estado` · `POST …/imprimir` |

Formato de error uniforme: `{ "error": { "code": "MESA_OCUPADA", "message": "…", "request_id": "…" } }`. El `request_id` también va en el
encabezado `X-Request-ID` y en los logs JSON.

### Respuesta del login (la usa el frontend)

```json
{
  "access_token": "…", "refresh_token": "…",
  "perfil": { "usuario": "GP1", "nombre": "GARZON 1  HOYO 19", "local": "RESTAURANTE HOYO 19", "rol": "garzon",
              "cloc": 2, "calm": 2, "cmon": 1, "nreg": 0 }
}
```

`local` es el nombre del local (texto, para mostrar); `cloc` es su código. El access token dura 15 minutos y el de renovación 1 día;
nunca llevan la clave.

## Configuración

Todo por variables de entorno (ver `../.env.example`). Las principales:

| Variable | Uso |
|---|---|
| `FLASK_ENV` | `development` en local. Por defecto es `production`, que **no arranca** con las claves de desarrollo. |
| `SECRET_KEY`, `JWT_SECRET_KEY` | Obligatorias y propias en producción (JWT de 32+ caracteres). |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Conexión a SQL Server. El backend usa `rt300_app` (solo datos, sin DDL). |
| `CORS_ORIGINS` | Orígenes del front permitidos (coma). |
| `GATEWAY_MODE` | `fake` (no imprime nada) · `soap` · `http` · `dll`. |
| `GATEWAY_WSDL_URL` | Para `soap`: la **misma URL que usaba el PHP** (`SYS_WEBSERVICE_DIR`), con o sin `?WSDL`. |
| `GATEWAY_HTTP_URL`, `GATEWAY_PASSWORD` | Para `http` y credencial técnica hacia el servicio (decisión pendiente). |
| `ADMIN_USERS`, `CAJERO_USERS` | Usuarios por rol, separados por coma (el mapeo real de roles está pendiente). |
| `IMAGENES_DIR`, `IMAGENES_CACHE_DIR` | Carpeta de imágenes de platos y caché WebP. |

## Seguridad aplicada

- Todo el SQL va **parametrizado**; los contadores (`rtsrl`) usan lista blanca.
- JWT de 15 min + refresh; `logout` **revoca** ambos tokens (lista en memoria; con varias instancias, mover a Redis).
- Login sin enumeración de usuarios: usuario inexistente, sin acceso a pedidos, sin clave o clave errónea dan el mismo mensaje.
- Límites: login 10/min por IP, `/auth/usuarios` 30/min, eliminar comanda 20/min; cuerpo máximo 1 MB.
- **Acceso por local:** un usuario solo opera mesas, folios y comandas de su local (`403 OTRO_LOCAL` en caso contrario).
- Eliminar comanda: el backend valida la clave del autorizador **antes** de escribir.
- Usuario de BD de mínimos permisos; puertos de Docker publicados solo en `127.0.0.1`; Flask sin depurador interactivo.
- Imágenes: anchos fijos y sin salir de la carpeta (anti path-traversal). Errores 500 sin detalle interno.

La clave se verifica con el algoritmo heredado `clave_calcular` (débil, sin sal) **solo para poder entrar con las claves ya existentes**;
la migración a un hash fuerte requiere una tabla propia y está pendiente de aprobación.

## Pruebas

`tests/unit/` (60): servicios con repositorios, gateway y unit of work **falsos** (auth, tokens, respuestas tipadas, salón, clientes, comandas,
acceso por local, gateway SOAP, helpers SQL, imágenes). Sin pruebas de integración contra la BD todavía; la verificación en vivo se hace con la colección de Bruno.

## Agregar una función nueva

1. Crear `app/modules/<nombre>/` con `ports.py`, `repository.py`, `service.py`, `schemas.py`, `routes.py`.
2. Registrar el servicio en `app/composition.py` y el blueprint en `create_app()`.
3. Escribir pruebas unitarias con un repositorio falso.

No se toca ningún módulo existente. Más en [01-backend-flask.md §11](../docs/01-backend-flask.md).

## Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| `health` devuelve `"db": false` | El contenedor `rt300-db-1` está apagado (pasa al reiniciar Docker): `docker compose up -d db`. |
| El `.bak` aparece como *carpeta* dentro del contenedor | Docker Desktop no ve esa unidad (p. ej. `F:`). Copiarlo a `docker/backup/tbpos_new.bak`. |
| `429 DEMASIADOS_INTENTOS` al hacer login | Límite de 10 por minuto por IP; esperar un minuto. |
| El backend no arranca con `FLASK_ENV` sin definir | En producción exige claves propias; definir `FLASK_ENV=development` en local. |
| Guardar/eliminar comandas «funciona» pero no imprime | `GATEWAY_MODE=fake` no llega a ninguna impresora. Para el servicio real, `GATEWAY_MODE=soap`. |
| `docker compose down -v` | Borra el volumen de datos y obliga a restaurar el `.bak` otra vez. No usarlo. |
