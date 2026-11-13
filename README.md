# RT-300 · Nuevo sistema de pedidos de restaurante

Reescritura del módulo **RT-300** (pedidos de restaurante del Club de Campo) con arquitectura limpia, sobre la **misma base de datos `tbpos_new`**
y la misma lógica de negocio del sistema PHP anterior (`RT-300WEB`), pero más segura y mantenible.

| Carpeta | Qué es | Estado |
|---|---|---|
| [`rt300-backend/`](rt300-backend/README.md) | API REST en Flask (40 endpoints, JWT, arquitectura limpia) | Completa y probada con el gateway falso |
| [`rt300-frontend/`](rt300-frontend/src/features/pedidos/README.md) | React + Vite + TypeScript (PWA) | Login, mesas, cuentas y comanda conectados al backend ([login](rt300-frontend/src/features/auth/README.md), [pedidos](rt300-frontend/src/features/pedidos/README.md)) |
| [`docs/`](docs/) | Arquitectura, diseño, puesta en marcha, registro de cambios, colección Bruno | Al día |
| `docker/`, `docker-compose.yml` | SQL Server 2017 con restauración del `.bak`, backend y frontend | Funcionando |
| `img/Restaurantes/` | Imágenes de platos del sistema antiguo | Copiada |

## Empezar

```bash
cp .env.example .env                 # ajustar BACKUP_FILE si hace falta
docker compose up -d db
docker compose up db-init            # restaura la BD la primera vez (~28 min)
docker compose up -d --build backend
cd rt300-frontend && npm install && npm run dev      # http://localhost:5173
```

Usuario de prueba: `GP1` / `123456`. Guía completa y problemas frecuentes: [docs/03-puesta-en-marcha.md](docs/03-puesta-en-marcha.md).

## Documentación

- [docs/CAMBIOS.md](docs/CAMBIOS.md) — **qué se hizo, qué cambió respecto al PHP y qué falta** (empezar por aquí)
- [docs/00-arquitectura-general.md](docs/00-arquitectura-general.md) — objetivo, flujos, decisiones abiertas, hoja de ruta
- [docs/01-backend-flask.md](docs/01-backend-flask.md) — diseño del backend y mapa de endpoints
- [docs/02-frontend-react.md](docs/02-frontend-react.md) — diseño del frontend
- [docs/03-puesta-en-marcha.md](docs/03-puesta-en-marcha.md) — cómo levantar y probar
- [docs/bruno/](docs/bruno/RT300.postman_collection.json) — colección de requests para Bruno/Postman

## Reglas del proyecto

- **No se altera el esquema de `tbpos_new`.** La base de Docker es una copia de producción: no usar `docker compose down -v`.
- Todo cambio relevante se registra en `docs/CAMBIOS.md`; los de una pantalla, también en el README de su feature.
