# Registro de cambios — RT-300 nuevo sistema

Qué se construyó, qué cambió respecto al sistema antiguo (`RT-300WEB`, PHP) y qué falta. Está agrupado por área; cada sección
indica la fecha. Las fechas son de 2026.

Documentos relacionados: [00 arquitectura](00-arquitectura-general.md) · [01 backend](01-backend-flask.md) ·
[03 puesta en marcha](03-puesta-en-marcha.md) · [README del backend](../rt300-backend/README.md) ·
[README del login (front)](../rt300-frontend/src/features/auth/README.md)

## Lo que NO cambió

- **El esquema de la base `tbpos_new`:** no se creó, alteró ni borró ninguna tabla, columna ni índice. El backend usa las mismas tablas legacy
  (`rtmsa`, `rtfol`, `rtfoc`, `rtcoh`, `rtcda`, `rttmp`, `adusr`, `rturt`…).
- **El flujo de negocio:** login → mesas → ocupar mesa → comanda (menú, extras, insumos, textos) → guardar → estado de cuenta →
  eliminar / reimprimir. Guardar sigue siendo: número de transacción → filas en `rttmp` → commit → llamada al servicio de comandas.
- **El contrato con el servicio de comandas:** las mismas 4 operaciones SOAP (`alta_comanda_rt300`, `eliminar_comanda_rt300`,
  `Reimprimir_comanda_rt300`, `stdo_cuenta_rt303`) con los mismos parámetros.
- **Las claves de los usuarios:** se siguen verificando con el algoritmo heredado `clave_calcular`, así que todos entran con la clave de siempre.

---

## 2026-11-09 · Corrección de arquitectura: respuestas tipadas y tokens *(sin commit al escribir esto)*

Se detectaron tres desviaciones respecto a la arquitectura documentada y se corrigieron.

| Desviación | Corrección |
|---|---|
| Los `schemas.py` solo tenían modelos de **entrada**; las rutas hacían `jsonify` de diccionarios con columnas legacy. | **Modelo de salida (`…Out`) por endpoint** en los 6 módulos y `core/respuesta.py` con `responder()`. Solo salen los campos declarados. |
| La ruta de login armaba los tokens y el perfil. | Nuevo `modules/auth/tokens.py` (`EmisorTokens`: emitir, renovar, cerrar sesión). Las rutas de auth quedan en 3 líneas. |
| El front manejaba tokens dentro de la feature (`features/auth/api.ts`). | Nuevo `revocarSesion()` en `lib/http.ts`, donde la arquitectura del front ubica los tokens. |

Otros cambios derivados:

- **Cierre de una fuga de datos:** `GET /clientes?codigo=` devolvía la fila completa de `gbage` (fecha de nacimiento, datos personales…). Ahora devuelve `{ codigo, nombre, nruc, ndid, lpre }`; `lpre` es la lista de precio, que la toma de pedido necesita. **Es el único cambio de contrato** de esta corrección.
- **Orden determinista:** las alternativas de un insumo (`rtial`) se devolvían sin `ORDER BY`, así que el orden dependía de SQL Server. Ahora van por `rtialcins, rtialitem`.
- `/health` y los demás endpoints usan el mismo mecanismo de respuesta.
- Nuevos archivos: `core/respuesta.py`, `core/salidas_comunes.py`, `modules/auth/tokens.py`. Los esquemas de entrada de `cuentas` pasaron de `routes.py` a `schemas.py`.

**Cómo se verificó que no se rompió el contrato:** se guardaron 35 respuestas reales (lecturas, errores y login) antes del cambio y se compararon
después: 33 idénticas byte a byte; las otras dos son las cambiadas a propósito (cliente por código y el orden de alternativas, con el mismo contenido).
Además se probó en vivo el flujo de escritura (ocupar, modificar, editar cuenta, guardar, reintentar, reimprimir, habilitar, rechazo de clave de
supervisor) y la sesión: antes de «Salir» el refresh token da 200 y después da `401 TOKEN_REVOCADO`. Pruebas unitarias: de 50 a **60**
(`test_respuesta.py` y `test_tokens.py`).

---

## 2026-11-09 · Login del frontend conectado al backend

### Frontend (`rt300-frontend`)

| Archivo | Cambio |
|---|---|
| `src/lib/env.ts` | `APP_MODE` pasa de `'mockup'` a `'production'`: el front usa la API real. **El mockup no se borró**; vuelve con `'mockup'`. |
| `src/features/auth/esquemas.ts` | `esquemaRespuestaUsuarios` espera `{ usuarios: [...] }`, el formato real (las listas del backend siempre vienen envueltas). |
| `src/features/auth/api.ts` | `listarUsuarios` devuelve la propiedad `usuarios`. `cerrarSesion` delega en `revocarSesion()`. |
| `src/lib/http.ts` | Nuevo `revocarSesion()`: lee los tokens **antes** de que se limpie la sesión y los envía explícitos (access en `Authorization`, refresh en el cuerpo) con el cliente sin interceptores. Antes el cierre de sesión salía sin token (el interceptor corre después de `cerrar()`) y el backend no podía revocarla. |
| `src/simulados/adaptador.ts` | El mockup responde `/auth/usuarios` con `{ usuarios }` para seguir el mismo contrato. |
| `src/features/auth/README.md` | Contrato real, tabla de códigos de error, pasos para conectar, usuarios de prueba reales y esta lista de cambios. |

### Backend (`rt300-backend`)

| Archivo | Cambio |
|---|---|
| `modules/auth/*` | `POST /auth/login` devuelve `perfil.local` con el **nombre del local** (`vtloc.vtlocdesc`, p. ej. «RESTAURANTE HOYO 19»), que el front exige como texto. El servicio devuelve ahora `ResultadoLogin(usuario, local)`; el repositorio gana `nombre_local()`. |
| `core/error_handlers.py` | Los errores HTTP genéricos 400, 404, 405, 413 y 429 llevan código y mensaje en español (`DEMASIADOS_INTENTOS`, `NO_ENCONTRADO`…). El front muestra el mensaje del servidor cuando no tiene uno propio para el código, y antes salía el texto en inglés de Werkzeug. |
| `tests/unit/test_auth_service.py` | Ajustado al nuevo resultado y comprueba `local`. |

### Verificado

En el navegador: la lista carga los 89 usuarios reales; clave incorrecta → 401 y cuenta el intento; `GP1`/`123456` entra a `/mesas` mostrando
«GARZON 1 HOYO 19»; «Salir» responde 200 y vuelve al login. `npx tsc -b`, `npm run lint` y las 50 pruebas del backend pasan.
Con 12 logins seguidos el 11.º responde `429 DEMASIADOS_INTENTOS`.

---

## 2026-11-09 · Seguridad y arquitectura (backend)

### Usuario de base de datos con permisos mínimos
- `docker/db/init.sql` crea el login `rt300_app` con solo `db_datareader` + `db_datawriter` (sin DDL, sin `sysadmin`). La contraseña entra por una
  variable de `sqlcmd` (`APP_DB_PASSWORD`), no está fija en el repositorio.
- El backend usa `rt300_app`. `prueba` / `prueba` (sysadmin) queda solo para explorar con un cliente SQL en desarrollo.
- Comprobado: puede leer y escribir (ocupar/habilitar mesa) y `CREATE TABLE` da *permission denied*.

### Separación por local
- Un usuario solo opera mesas, folios y comandas **de su local** (`cloc` del token); lo demás responde `403 OTRO_LOCAL`.
  Mesa → local por su área (`rtmsa.rtmsacaco → rtaco.rtacocloc`); folio → `rtfol.rtfolcloc`.
- Aplicada en todos los servicios (salon, clientes, comandas, cuentas) mediante `core/acceso.py`. Antes de activarla se comprobó en los datos
  reales que todas las mesas y folios tienen local, para no romper casos legítimos.

### Gateway SOAP configurable
- `GATEWAY_WSDL_URL` acepta **la misma URL que usaba el PHP** (`SYS_WEBSERVICE_DIR`), con o sin `?WSDL`. En el servidor del club basta con
  `GATEWAY_MODE=soap` y esa variable.
- El servicio real no se pudo probar desde el entorno de desarrollo (`192.168.0.2` no responde); el cliente está cubierto con pruebas de contrato
  usando un cliente falso.

### Refactor SOLID
- `app/domain/` sin Flask ni SQL (`Usuario`, `Mesa`, `UnitOfWork`).
- Cada módulo con `ports.py` (contratos `Protocol` + dataclasses), `repository.py` (SQL), `service.py` (casos de uso con dependencias inyectadas).
- `app/composition.py` como único sitio donde se eligen las implementaciones concretas.
- `with uow:` reemplaza los `commit`/`rollback` manuales.
- Gateway con interfaces pequeñas (`AltaComandaGateway`, `GestionComandaGateway`, `EstadoCuentaGateway`), registro por `GATEWAY_MODE` y
  `DllGateway` instanciable.
- `comandas` dividido en `guardar.py` y `administrar.py`; ningún módulo importa el repositorio de otro.
- Pruebas unitarias con repositorios falsos: de 1 a **50**.

### Imágenes de platos
- `img/Restaurantes` (163 archivos, 3,4 MB) copiada del proyecto antiguo y montada de solo lectura en el contenedor.
- En la BD copiada solo 1 de 2155 platos tiene imagen asignada y ese archivo no existe, así que casi todo muestra el placeholder.

---

## 2026-11-06 · Backend, base de datos y Docker (commits `53f5b4a` y `3d366ab`)

### Base de datos y Docker
- SQL Server 2017 **Developer** en Docker (Express limita a 10 GB y la BD pesa ~7 GB + log de ~26 GB al restaurar).
- Restauración del `.bak` con `docker/db/init.sql` (~28 min, 425 tablas). Docker Desktop no veía la unidad `F:`, así que el backup se copia a
  `docker/backup/tbpos_new.bak` (ignorado por git).
- Puertos publicados solo en `127.0.0.1`; Flask sin depurador interactivo; `FLASK_ENV` por defecto `production`.

### API REST v1 (37 endpoints)
Módulos `auth`, `salon`, `clientes`, `menu`, `comandas` y `cuentas`, portados desde `RT300a/b/c.php` y `RT303.php` con la misma lógica.
Equivalencia función a función en [01-backend-flask.md §5](01-backend-flask.md). Colección de 38 requests en `docs/bruno/`.
No se portó `datos_modifica_insumo_rt300c`: está marcada «Eliminar» en el PHP y el JS no la llama.

### Mejoras de comportamiento respecto al PHP

| Antes (PHP) | Ahora | Por qué |
|---|---|---|
| `NroSerial`: SELECT y luego UPDATE | `UPDATE … OUTPUT` atómico | Evita folios/transacciones duplicados |
| Dos garzones podían ocupar la misma mesa | La toma es atómica; el segundo recibe `409 MESA_OCUPADA` | Concurrencia |
| Guardar comanda sin validar la cuenta | Exige que la cuenta esté abierta | Evita datos huérfanos |
| Editar cuenta sin validar la mesa | Exige mesa ocupada y del mismo folio | Idem |
| El servicio validaba la clave del supervisor | El backend la valida antes de escribir en `rttmp` | No dejar filas huérfanas |
| Si el servicio fallaba tras el commit, `rttmp` quedaba huérfana | El error trae `ntmp` y existe `POST /comandas/{ntmp}/reintentar` | Reintento idempotente |
| Una consulta por fila (precios, insumos, cuentas, detalle) | JOIN / `OUTER APPLY` / `IN (…)` por lote; INSERT de `rttmp` en lote | Rendimiento |
| SQL concatenado | Todo parametrizado | Inyección SQL |
| `new data()` compartía el enlace ODBC y dejaba datos vacíos | Una conexión por petición, resultados materializados | Ver [01 §12](01-backend-flask.md) |
| Bug: al guardar el NIT se preguntaba por la variable equivocada (`rtcfr`) | Corregido (actualiza o inserta) | Error del PHP |
| Área 0 del usuario = «sin área» sin mesas | Se usa la primera área del local | Pantalla vacía |

### Seguridad
- JWT de 15 min + refresh de 1 día; `logout` revoca ambos tokens.
- Login sin enumeración de usuarios (mismo mensaje en los casos de fallo).
- Límites: login 10/min por IP, `/auth/usuarios` 30/min, eliminar comanda 20/min; cuerpo máximo 1 MB.
- Imágenes con anchos fijos y sin salir de la carpeta; errores 500 sin detalle interno, con `request_id`.

---

## Pendientes y decisiones abiertas

| # | Tema | Estado |
|---|---|---|
| 1 | **Servicio de comandas real** (SOAP en `192.168.0.2`): probar `?WSDL` desde la red del club y fijar `GATEWAY_MODE=soap` | Pendiente de red |
| 2 | **Credencial hacia el servicio** (`GATEWAY_PASSWORD`): ¿valida clave o solo usuario? | Decisión |
| 3 | **`GET /auth/usuarios` público** (lo usa el carrusel de acceso rápido del front): ¿se mantiene? | Decisión |
| 4 | **Roles reales** y quién puede autorizar eliminar comandas (hoy `ADMIN_USERS` / `CAJERO_USERS`) | Decisión |
| 5 | **Hash fuerte de claves** en una tabla propia (primera modificación de esquema) | Requiere aprobación |
| 6 | Producción: TLS con certificado validado, Redis para límites y revocaciones si hay varias instancias, `pip-audit` | Pendiente |
| 7 | Pantallas del front posteriores al login (mesas, comanda, cuentas, estado de cuenta) | Equipo de front |
| 8 | Pruebas de integración contra la BD y pruebas de API | Pendiente |

## Efectos en la copia local de la base

Las pruebas en vivo ocuparon y liberaron la mesa `HPB02`: quedaron folios anulados y los contadores `rtsrl` avanzaron. Las filas de prueba
creadas en `rttmp` se borraron. La base de Docker es una **copia de producción**: no usar `docker compose down -v` (obliga a restaurar de nuevo).

## Historial de commits

| Commit | Fecha | Contenido |
|---|---|---|
| `aa6640d` | 11-06 | Estructura inicial y documentación |
| `53f5b4a` | 11-06 | Docker: SQL Server Developer, restauración del backup, puertos locales |
| `3d366ab` | 11-06 | Backend completo: API, arquitectura limpia, seguridad base, pruebas |
| `e19d920` | 11-09 | Imágenes de platos, usuario de BD mínimo, acceso por local, SOAP configurable, refactor SOLID y documentación |
| `3074a55` | 11-09 | Login del frontend (equipo de front) |
| *(pendiente)* | 11-09 | Conexión del login con el backend, corrección de arquitectura (respuestas tipadas, tokens) y documentación |
