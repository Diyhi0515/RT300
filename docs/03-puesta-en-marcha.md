# Puesta en marcha

Monorepo con un solo Git. Comandos para **PowerShell** o Git Bash (Windows). Requisito: **Docker Desktop**.

```
D:\Proyectos\RT300\
├── rt300-backend\        # API Flask (arquitectura limpia, ver 01-backend-flask.md)
├── rt300-frontend\       # React (lo desarrolla otro equipo; ver 02-frontend-react.md)
├── docker\               # init.sql de la BD y (ignorado por git) backup\ con el .bak
├── img\Restaurantes\     # imágenes de platos copiadas del proyecto antiguo
├── docs\                 # estos documentos + docs\bruno\ (colección de endpoints)
├── docker-compose.yml    # db + db-init + backend (+ frontend)
└── .env                  # configuración local (NO se sube a git; plantilla: .env.example)
```

## 1. Configuración

```powershell
Copy-Item .env.example .env
```

Variables que conviene revisar en `.env`:

| Variable | Para qué |
|---|---|
| `BACKUP_FILE` | Ruta del `.bak` de `tbpos_new`. **Docker Desktop no siempre ve otras unidades (p. ej. `F:`)**: si el montaje falla crea una *carpeta* en lugar de mapear el archivo. Copia el `.bak` a `docker\backup\tbpos_new.bak` y usa `./docker/backup/tbpos_new.bak`. |
| `FLASK_ENV` | `development` en local. Por defecto es `production`, que **rechaza** las claves de desarrollo. |
| `GATEWAY_MODE` | `fake` (por defecto, no imprime nada) · `soap` · `http` · `dll`. Ver 01 §7. |
| `IMAGENES_DIR` | `./img/Restaurantes`. |

## 2. Levantar la base de datos y restaurar el backup

```bash
docker compose up -d db
docker compose up db-init        # restaura tbpos_new si no existe; sale con código 0
```

- Imagen: SQL Server 2017 **Developer** (Express limita la BD a 10 GB y esta pesa ~7 GB de datos + log de ~26 GB al restaurar).
- La restauración tardó ~28 min (7,4 GB). Mientras corre, `sys.dm_exec_requests` muestra el porcentaje.
- Se crean dos logins: `rt300_app` (**el que usa el backend**: `db_datareader` + `db_datawriter`, sin DDL ni sysadmin; contraseña en `DB_PASSWORD`) y `prueba` / `prueba` (sysadmin, **solo para que tú explores con un cliente SQL en desarrollo**; no usarlo en producción).
- Los datos viven en el volumen `rt300_sqldata`. **No uses `docker compose down -v`**: obliga a restaurar de nuevo.
- Los puertos se publican solo en `127.0.0.1` (SQL Server `1433`, API `5000`, front `5173`).

Conectar con un cliente SQL (Azure Data Studio, DBeaver, SSMS): servidor `localhost,1433`, usuario `prueba` (o `rt300_app` para ver lo mismo que ve la API), base `tbpos_new`, activar *Trust server certificate*.

## 3. Levantar el backend

```bash
docker compose up -d --build backend
curl http://localhost:5000/api/v1/health      # {"db": true, "status": "ok"}
```

El código se monta en caliente (`--reload`), sin depurador interactivo. Logs: `docker compose logs -f backend`.

Usuario de prueba (clave que dejó el proyecto antiguo en la copia): **`GP1` / `123456`**.

## 4. Probar los endpoints

Importa `docs\bruno\RT300.postman_collection.json` en Bruno (Collections → Import → Postman). Ejecuta primero *auth › Login*.

## 5. Pruebas

```bash
docker compose exec backend python -m pytest tests/unit -q
docker compose exec -T -e RT300_INTEGRATION=1 backend python -m pytest tests/integration -q
cd rt300-frontend && npm test
```

Flujo manual completo para probar en tu PC: [04-pruebas-locales.md](04-pruebas-locales.md).

## 6. Servicio de comandas real

Con `GATEWAY_MODE=fake` guardar/eliminar/reimprimir comandas e imprimir estado de cuenta **no llegan a ninguna impresora**.
Para el servicio real (SOAP en la red del club) verificar primero desde esa red:

```bash
curl -i "http://192.168.0.2/RT300WS/RT300.asmx?WSDL"
```

y arrancar con `GATEWAY_MODE=soap` y `GATEWAY_WSDL_URL=<esa URL>`. Se acepta **la misma URL que usaba el PHP** (`SYS_WEBSERVICE_DIR`, sin `?WSDL`) o con él; basta cambiar esas dos variables en `.env`, sin tocar código. Ver [01-backend-flask.md §7](01-backend-flask.md).

## 7. Frontend

El login del frontend **ya está conectado** a este backend (`rt300-frontend/src/lib/env.ts` → `APP_MODE = 'production'`; el mockup se conserva).
Detalles, contrato y cambios: [`rt300-frontend/src/features/auth/README.md`](../rt300-frontend/src/features/auth/README.md).

```bash
docker compose up -d db backend      # base de datos + API
cd rt300-frontend && npm install && npm run dev
```

En desarrollo el front llama a `/api/v1` y el proxy de Vite lo reenvía a `http://127.0.0.1:5000` (se usa la IP y no `localhost` porque en Windows `localhost` prueba primero IPv6 y añade ~200 ms a cada petición) (no hace falta CORS).
Si usa `VITE_API_URL` con otro origen, ese origen debe estar en `CORS_ORIGINS` del backend.
Para las siguientes pantallas: guardar `access_token` (15 min), renovar con `/auth/refresh`, y al cerrar sesión llamar `/auth/logout`
enviando el `refresh_token` en el cuerpo (el backend revoca ambos tokens).

## 7.1 HTTPS (TLS) y Redis

- **Redis** ya es parte del `docker-compose.yml` (sin puerto publicado, con clave `REDIS_PASSWORD`). El backend lo usa solo; no hay que hacer nada.
- **HTTPS local o en servidor** con Caddy (certificado propio, se renueva solo):

```bash
PROXY_HOPS=1 VITE_API_URL=/api/v1 docker compose --profile https up -d
```

Abre `https://127.0.0.1:8443`. El navegador avisará del certificado hasta que confíes en la CA de Caddy (volumen `caddy_data`, `pki/authorities/local/root.crt`). `PROXY_HOPS=1` es obligatorio con el proxy, para que el backend vea la IP real y el esquema https.
En un servidor con dominio, cambia las direcciones de `docker/proxy/Caddyfile` por el dominio y quita `tls internal`: Caddy obtiene un certificado público solo. Para volver al modo normal: `docker compose stop proxy` y `docker compose up -d backend frontend`.

## 8. Reglas de trabajo con la base de datos

- **No se altera el esquema** de `tbpos_new`. Las pruebas que escriben (ocupar/habilitar mesa, guardar comanda) dejan folios anulados y avanzan los contadores `rtsrl`: usar solo la BD de Docker, y borrar a mano las filas de `rttmp` creadas por pruebas.
- El backup es **una copia de producción**: trátala con cuidado (`rttmp` tiene ~2,5 millones de filas).
