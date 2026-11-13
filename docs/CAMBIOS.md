# Registro de cambios — RT-300 nuevo sistema

Qué se construyó, qué cambió respecto al sistema antiguo (`RT-300WEB`, PHP) y qué falta. Está agrupado por área; cada sección
indica la fecha. Las fechas son de 2026.

Documentos relacionados: [00 arquitectura](00-arquitectura-general.md) · [01 backend](01-backend-flask.md) ·
[03 puesta en marcha](03-puesta-en-marcha.md) · [04 pruebas locales](04-pruebas-locales.md) · [README del backend](../rt300-backend/README.md) ·
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

## 2026-11-13 · Mejora de seguridad, velocidad y calidad + pruebas *(sin commit al escribir esto)*

Sin cambios de esquema de BD ni de flujo de negocio. Guía para probar: [04-pruebas-locales.md](04-pruebas-locales.md).

### Seguridad
- Cabeceras HTTP seguras en todas las respuestas; `Cache-Control: no-store` salvo el menú.
- Límite de intentos de login **por usuario** (10 / 10 min) además del de IP; `ProxyFix` configurable (`PROXY_HOPS`) para que la IP no se falsifique.
- En producción el arranque falla si quedan claves o usuario de BD de desarrollo, o CORS vacío/`*`.
- Datos mínimos en las respuestas (`/salon/parametros`, detalle de mesa y modificación, todos con modelos de salida tipados).
- `X-Request-Id` entrante validado; imágenes sirven aunque la caché no sea escribible.
- **Tokens revocados en un archivo SQLite** por defecto (`REVOCADOS_DB`, en Docker volumen `appdata`): sobreviven a reinicios sin depender de Docker ni de ningún servicio. Verificado: login → logout → reinicio del backend → el token sigue dando 401. Si el archivo no se puede escribir, cae a memoria con un aviso en el log.
- **Redis es opcional** (solo para varias máquinas): `docker compose --profile redis up -d` y `REDIS_URL` en `.env`. Los contadores de intentos de login siguen en memoria salvo que uses Redis (se reinician con el servidor; aceptable con un solo servidor).
- **Auditoría de dependencias** (2026-11-13): `pip-audit` sin vulnerabilidades; `npm audit --omit=dev` (lo que llega al navegador) sin vulnerabilidades. `npm audit` completo marca 19 en herramientas de desarrollo (eslint, workbox, javascript-obfuscator); no se publican. No se aplicó `audit fix --force` por riesgo de romper el build.
- **HTTPS** opcional con Caddy (`--profile https`, `docker/proxy/Caddyfile`); verificado en `https://127.0.0.1:8443` con HSTS y las cabeceras de seguridad. Ver [03 §7.1](03-puesta-en-marcha.md).
- Contenedor del backend sin privilegios (`app`) con `HEALTHCHECK`; puertos solo en `127.0.0.1`.

### Velocidad (medido en local)
- Platos con precios: ~600 ms → ~40 ms (consulta con el índice `inpva`); con caché TTL del menú ~9 ms.
- gzip en JSON ≥ 1 KB; `Cache-Control` público de 5 min en el menú.
- El front usa `127.0.0.1` en vez de `localhost` (en Windows `localhost` sumaba ~200 ms por petición). Rutas del front ya cargan por partes (lazy).

### Calidad
- Caché como decorador (`MenuRepoConCache`), `core/cache.py`, `core/compresion.py`, `core/seguridad_http.py`: cada una con una sola responsabilidad.
- `ruff` configurado (`pyproject.toml`) y sin hallazgos.
- Variables nuevas: `MENU_CACHE_SECONDS`, `PROXY_HOPS`, `RATE_LIMIT_DEFAULT` (en `.env.example` y `docker-compose.yml`).

### Pruebas
| Dónde | Cantidad | Cómo |
|---|---|---|
| Backend unitarias | 150 | `docker compose exec backend python -m pytest tests/unit -q` |
| Backend integración (solo lectura) | 11 | `RT300_INTEGRATION=1 ... pytest tests/integration` |
| Front (Vitest + Testing Library + msw) | 81 | `npm test` |

Front: mapeos, cálculos, contrato con el backend (respuestas reales anonimizadas en `src/test/fixtures`), cliente HTTP (renovación de sesión, 401 concurrentes, logout) y componentes (ocupar mesa y enviar comanda solo mandan lo permitido).

### Área de administración (front)
- Nuevo `/admin` con **sidebar** (cajón en móvil), protegido por rol `admin`; el módulo Administración solo aparece a ese rol. `/mesas` redirige a `/admin`.
- 4 secciones de solo lectura con endpoints ya existentes: Panel, Mesas en servicio, Menú, Clientes. 4 entradas bloqueadas: Liberar mesa, Comandas, Usuarios y roles, Reportes. Detalle: [`features/admin/README.md`](../rt300-frontend/src/features/admin/README.md).
- **Recarga de página sin 401:** el token de acceso vive solo en memoria, así que al recargar las primeras consultas salían sin token, recibían 401 y recién ahí renovaban (ruido en la consola y una petición de más). Ahora `lib/http.ts` renueva *antes* de enviar si hay token de renovación pero no de acceso, con una sola renovación compartida entre consultas simultáneas. Pruebas en `lib/http.test.ts`.
- `tiempoCorto` muestra días (`2d 4h`) cuando pasa de 24 h. Front: 76 pruebas.

### Sesión con cookie HttpOnly y CSP del front
- **El token de renovación salió de JavaScript:** ahora viaja en la cookie `rt300_rt` (`HttpOnly; SameSite=Strict; Path=/api/v1/auth`, `Secure` fuera de desarrollo). `sessionStorage` ya no guarda ningún token. Verificado en el navegador: `document.cookie` vacío, recarga → `refresh` 200 por cookie, logout → `refresh` 401.
- **CSRF:** `/auth/refresh` y `/auth/logout` exigen `X-Requested-With: rt300` (403 `CSRF` sin ella); CORS con credenciales solo para `CORS_ORIGINS`; logout nunca falla por un token vencido y revoca acceso y renovación.
- **Contrato:** el login ya no devuelve `refresh_token`; logout sin cuerpo. La colección de Bruno se actualizó (Refresh sin auth y con la cabecera).
- **CSP y cabeceras del front** en `docker/proxy/Caddyfile.prod` (perfil `produccion`, puerto 8444): `script-src 'self'` sin inline, etc. Verificada en el navegador sin violaciones. El script del tema pasó a `public/tema-inicial.js`. Ver [03 §7.2](03-puesta-en-marcha.md).
- Pruebas: backend 150 unitarias; front 79.
- **Limitación de la prueba:** el service worker del PWA no se pudo comprobar en el navegador integrado (no registra service workers, con o sin CSP); la CSP lo permite (`worker-src 'self'`). La prueba de la CSP se hizo por HTTP local con la misma política (sin `upgrade-insecure-requests`), porque el navegador integrado no confía en el certificado local de Caddy.

### Corrección: cuentas no pueden superar a comensales
- Yo había quitado esta regla creyendo que el sistema antiguo no la tenía. **Sí la tiene** (`PHJ/RT300a.js`, validación al ocupar y al modificar la mesa; solo en el navegador, el PHP no la comprobaba). Se restauró y ahora además la exige el servidor: `422 CUENTAS_MAYOR_COMENSALES` al ocupar y al modificar (y `COMENSALES_INVALIDOS` si hay menos de 1 comensal), después de comprobar el acceso al local.
- **Auditoría completa de restricciones** del sistema antiguo (tabla en [`features/pedidos/README.md`](../rt300-frontend/src/features/pedidos/README.md)): todas se cumplen en el servidor; la única que faltaba además de esta era el diálogo "Confirma: Guardar Comanda?", ya agregado en el front ("¿Enviar la comanda?").
- Front: el contador de cuentas no pasa del número de comensales, los comensales no bajan del número de cuentas, y "agregar cuenta" avisa si ya hay tantas cuentas como comensales. Pruebas nuevas: 4 en el backend y 1 en el front.

### Corrección: lista pública de usuarios del acceso rápido
- `GET /auth/usuarios` devolvía **89** usuarios; el `index.php` antiguo solo listaba **34**: habilitado (`adusrmrcb = 0`), con clave y marcado en `rturt.rturtmtab = 1`. Se había perdido el filtro `rturtmtab` al migrar. Restaurado; prueba de integración que compara con la consulta original.
- Sigue siendo una ruta pública, igual que en el sistema antiguo (devuelve solo `usuario` y `nombre`, con límite de 30/min). Reducirla más (por red del club o quitando el acceso rápido) es una decisión pendiente.

### Auditoría de filtros y reglas del sistema antiguo (2026-11-13)
Se comparó, consulta por consulta, el SQL del PHP (`index.php`, `RT300a/b/c/303.php`) con los repositorios nuevos. **Coinciden**: login (todas las comprobaciones), mesas y áreas (`stat = 1`, `mrcb = 0`), cuentas (`mrcb = 0`), comandas vigentes (`esco = 1`, `mrcb = 0`), menú (secciones, subsecciones, platos con la unión de `rtacp` y `rtalbmprd = 'N'`, extras, textos), clientes, estado de cuenta y las comprobaciones de guardar comanda. Se encontraron y corrigieron:
- **Lista del acceso rápido** (filtro `rturtmtab = 1`): ver sección anterior.
- **Eliminar y reimprimir comandas:** el sistema antiguo dejaba elegir solo comandas vigentes del folio y un motivo de la tabla, y el servicio de comandas lo volvía a comprobar. Aquí no se comprobaba nada antes de escribir: se podía mandar el número de una comanda ajena al folio. Ahora el servidor exige que los productos sean de comandas vigentes del folio (`ITEMS_NO_VIGENTES`), que el motivo exista (`MOTIVO_INVALIDO`) y que la mesa sea la del folio (`MESA_NO_COINCIDE`), antes de registrar nada.
- **Imprimir cuenta:** solo se imprime una cuenta abierta (`CUENTA_NO_ABIERTA`), como en la lista del PHP; antes bastaba con que el folio estuviera abierto.
- Pruebas: 150 unitarias en el backend.

Diferencias a propósito (más estrictas o distintas, no se perdió nada): la cantidad por producto se limita a 99; el login da un mismo mensaje para clave faltante, usuario inexistente o clave errónea; la sesión es un token de 15 min renovable por 1 día (el PHP usaba una sesión de 24 h con renovación por uso).

### Pendiente / decisiones abiertas
`GET /auth/usuarios` sigue público; roles reales para autorizar eliminar comanda; hash de clave fuerte (requiere tabla propia); servicio SOAP real sin probar (192.168.0.2 no es alcanzable desde esta PC).

---

## 2026-11-13 · Pantallas de mesas, pedidos y comanda conectadas al backend *(sin commit al escribir esto)*

El equipo de front subió las pantallas nuevas (`808abf5`: `/inicio`, `/pedidos`, `/pedidos/cuentas/:mesa`, `/mesas`). Estaban **100 % simuladas**: sus stores traían datos inventados y no llamaban a la API; además el build de producción incluía esos datos. Ahora usan el backend real.

### Decisiones acordadas

| Tema | Decisión |
|---|---|
| Reservar mesa / estado "reservada" | Quitado (la base solo tiene libre y ocupada) |
| "Por cobrar" y "Liquidar cuenta" | Quitados. Pedir cuenta pasa a **Imprimir cuenta**; liquidar es del módulo de caja |
| Agregar y quitar cuentas | Botones con reglas: agregar suma una; quitar solo la última y sin consumo |
| Regla "cuentas ≤ comensales" | Quitada (no existe en el sistema antiguo) |

### Backend

| Cambio | Detalle |
|---|---|
| `perfil.cven` | El login devuelve el código de mesero del usuario (va en el token). Ocupar y modificar mesa ya no exigen `cven`: se usa el del usuario |
| Mesas enriquecidas | `GET /salon/areas/{caco}/mesas` y `/salon/parametros` devuelven `capacidad` (sillas), `posx`, `posy` y, si está ocupada, `comensales` del folio, `mozo`, `cven`, `apertura` (ISO), `cuentas` y `consumo`, en una sola consulta. **`comensales` pasó a significar los del folio; las sillas son `capacidad`** |
| `GET /salon/mesas` | Todas las mesas del local del usuario en una llamada (el front cuenta ocupadas por área) |
| `GET /salon/folios/{nfol}/detalle` | Cuentas del folio con cliente y líneas de consumo, en 2 consultas (sin una por cuenta) |
| `POST /folios/{nfol}/cuentas/{ncta}/comandas` | **El servidor arma la comanda**: el cliente solo envía `{ cart, cant }`. Precio (con la lista de la cuenta), centro de producción e insumos salen de la base; `rttmp` queda con las mismas filas que generaba el navegador antiguo. Corrige que el servidor aceptaba el precio enviado por el cliente. `POST /comandas` sigue disponible como bajo nivel |
| Insumos | Cantidad total = producto + merma (así está en 1,06 millones de filas reales de `rtcia`; el JS antiguo tenía un error de concatenación de textos que daba otro resultado según los decimales) |
| `GET /clientes` | La búsqueda por nombre ahora también devuelve `nruc` |
| Ficha del plato | `/menu/platos/{cart}` devuelve `descripcion` |
| Sesiones anteriores | Un refresh token sin `cven` responde `401 SESION_DESACTUALIZADA` y el front cierra la sesión: hay que ingresar otra vez |
| Código | `modules/comandas/armar.py` (caso de uso), `catalogo_menu.py` (adaptador al módulo menú, sin que `comandas` importe `menu`), puertos nuevos; 3 endpoints, 76 pruebas unitarias |

### Frontend (`rt300-frontend`)

| Cambio | Detalle |
|---|---|
| Capa de datos | `features/pedidos/{esquemas,api,mapeos,hooks}.ts` (zod + TanStack Query). `store.ts` quedó solo con estado de pantalla |
| Componentes | `PlanoMesas`, `DesplegableArea`, `CabeceraMesa`, `PanelMesa`, `FormularioOcupar`, `ResumenMesa`, `TodasLasCuentas`, `ComandaNueva`, `DatosCuentasPage` leen y escriben por la API |
| Comanda | Menú real: 18 secciones y 124 subsecciones, productos con precio de la base |
| Administración | `/mesas` usa las mesas reales; tocar una mesa la abre en Pedidos. Se eliminaron `ModalMesa`, el store y los tipos del prototipo |
| Mockup | `simulados/pedidos.ts` y `salon.ts` se conservan con tipos propios, sin uso. **El adaptador del mockup solo cubre el login** |
| Build | El bundle de producción ya no contiene datos de prueba (comprobado) |
| `features/pedidos/README.md` | Nuevo: flujo de datos, endpoints, reglas, mapeos y pendientes |

### Verificado

En el navegador con la base real: carga de 20 mesas de "HOYO 19 PLANTA BAJA" (mesa 01 ocupada, Bs 2.084), renovación automática del token, ocupar la mesa HPB02, abrir Nueva comanda con el menú real, enviar 3 productos (`POST …/comandas → 201`, `rttmp` con 2 líneas, 7 insumos y 5 componentes con cantidades coherentes), agregar una cuenta (`PATCH → 200`), búsqueda de clientes de la agenda y la confirmación de habilitar. Se verificó el cierre de sesiones anteriores. `npx tsc -b`, `npm run lint` y `npm run build` pasan; 76 pruebas del backend en verde. Las pruebas escribieron en la copia de la base: la mesa quedó libre y se borraron las filas de prueba de `rttmp`.

### Pendiente

Insumos modificables, extras y textos en la comanda; pantalla de eliminar y reimprimir comandas; búsqueda en todo el menú; imágenes de platos; ampliar el mockup. Con `GATEWAY_MODE=fake` la comanda no aparece en el consumo (la crea el servicio real).

---

## 2026-11-09 · Corrección de arquitectura: respuestas tipadas y tokens

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
| `79d5338`, `e1969fe` | 11-09 | Conexión del login con el backend, corrección de arquitectura (respuestas tipadas, tokens) y documentación |
| `808abf5` | 11-12 | Pantallas nuevas del front (equipo de front, aún simuladas) |
| *(pendiente)* | 11-13 | Pantallas de mesas, pedidos y comanda conectadas al backend |
