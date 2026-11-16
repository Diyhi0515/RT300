# 04 · Probar todo en tu PC (flujo paso a paso)

Guía para probar el sistema de punta a punta en local: base de datos y API en Docker, front con Vite. Usa siempre la BD de **Docker** (copia del backup),
nunca la del club. Fecha de referencia: 2026-11-13.

## 0. Requisitos

Docker Desktop encendido, Node 22+, y el `.bak` copiado en `docker/backup/tbpos_new.bak` (ver [03](03-puesta-en-marcha.md)). Ya debe existir `.env` (copia de `.env.example`).

## 1. Levantar base de datos y API

```bash
docker compose up -d db backend
```

Espera ~30 s la primera vez (restaura el backup). Comprueba que responde (usa `127.0.0.1`, no `localhost`):

```bash
curl http://127.0.0.1:5000/api/v1/health
```

Esperado: `{"db":true,"status":"ok"}`. Si falla: `docker compose logs backend --tail 50`.

## 2. Levantar el front

```bash
cd rt300-frontend
npm install
npm run dev
```

Abre **http://127.0.0.1:5173** (también funciona `localhost:5173`). El proxy de Vite reenvía `/api` al backend.

## 3. Recorrido manual

Con `GATEWAY_MODE=fake` las comandas **no se imprimen** en cocina: el sistema las guarda y responde como si lo hubiera hecho.

| # | Haz esto | Debes ver |
|---|---|---|
| 1 | Entra con usuario `GP1`, clave `123456` | Pantalla `/inicio` con tu nombre y local. Usuario o clave mal → "Usuario o contraseña incorrectos." |
| 2 | Ve a **Pedidos** (`/pedidos`) | El plano de mesas del local por área; mesas libres y ocupadas con mozo y tiempo. |
| 3 | Toca una mesa **libre** (ej. `HPB02`) y pulsa **Ocupar mesa** (comensales 2, cuentas 1) | Aviso "Mesa HPB02 ocupada"; la mesa pasa a ocupada y atiende tu usuario. |
| 4 | **Nueva comanda** en la cuenta 1 | Se abre el menú con secciones y subsecciones; los productos muestran precio. |
| 5 | Agrega 2 productos (uno ×2) y pulsa **Enviar a cocina** | Aviso "Comanda enviada a cocina"; el consumo de la mesa sube. |
| 6 | **Agregar cuenta** | La mesa tiene 2 cuentas. Quitar cuenta solo funciona si está vacía. |
| 7 | **Datos de cuentas** → busca un cliente y asígnalo a una cuenta | La cuenta muestra el cliente. *Prueba con clientes ficticios; no guardes datos reales.* |
| 8 | **Imprimir cuenta** | Aviso de éxito (en modo fake no sale papel). |
| 9 | **Habilitar mesa** | La mesa vuelve a libre. |
| 10 | Cierra sesión y recarga | Vuelve al login; el botón "atrás" no muestra datos. |

Casos de error útiles: 11 intentos de login seguidos con clave mala → "Demasiados intentos" (límite por usuario); apagar el backend
(`docker compose stop backend`) y tocar algo → "No hay conexión con el servidor".

### Área de administración

Para ver `/admin` hace falta un usuario con rol admin. En tu `.env` local agrega `ADMIN_USERS=GP2`, luego `docker compose up -d backend`, cierra sesión y entra con `GP2` / `123456`.
Debes ver el módulo **Administración** en `/inicio`; dentro, el sidebar con Panel, Mesas en servicio, Menú y Clientes (en el celular, el botón **Menú**). Con `GP1` el módulo no aparece y `/admin` te devuelve a `/inicio`.

## 4. Pruebas automáticas

```bash
# Backend: 158 pruebas unitarias (sin BD) y estilo
docker compose exec backend python -m pytest tests/unit -q
docker compose exec backend ruff check app tests

# Backend contra la BD de Docker (12 pruebas, solo lectura)
docker compose exec -T -e RT300_INTEGRATION=1 backend python -m pytest tests/integration -q

# Front: tipos, estilo, pruebas y build
cd rt300-frontend
npm run typecheck && npm run lint && npm test && npm run build
```

Las pruebas del front usan **respuestas reales anonimizadas** (`src/test/fixtures`). Si el backend cambia un contrato, `esquemas.test.ts` falla.
Para regenerarlas con el backend encendido: `npm run fixtures`.

## 5. Limpieza después de probar

El recorrido escribe en la BD de Docker (folios, contadores `rtsrl`, filas en `rttmp`). Es normal y no afecta al club. Para dejar todo limpio:

```bash
docker compose down -v      # borra la BD de Docker; la próxima vez se restaura del backup
```

Si solo quieres liberar la mesa de prueba, usa **Habilitar mesa** (paso 9).

## 6. Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| Todo tarda ~200 ms más | Usaste `localhost`; usa `127.0.0.1`. |
| "El usuario no tiene mesero asignado" | Sesión vieja: cierra sesión y entra de nuevo (el refresh ahora devuelve 401 `SESION_DESACTUALIZADA`). |
| Error de CORS en el navegador | Abre el front por `127.0.0.1:5173` o `localhost:5173`; ambos están en `CORS_ORIGINS`. |
| `curl` al health no responde | `docker compose ps`; mira `docker compose logs backend`. Puerto 5000 ocupado por otro programa. |
| Las imágenes de platos no aparecen | Falta la carpeta `img/Restaurantes` (ver README del backend); no impide operar. |
