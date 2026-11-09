# Feature `auth`: inicio de sesión de mozos

Pantalla de ingreso del sistema RT-300 (ruta `/login`). Este documento resume todo lo que se construyó para el login, cómo funciona y cómo se prueba.

La feature sigue la arquitectura de `docs/02-frontend-react.md`: carpeta propia con `pages/`, `components/`, `api.ts`, `hooks.ts`, `store.ts`, `types.ts` e `index.ts`. Los archivos y nombres que no define el README están en español.

## Qué hace

- Muestra la tarjeta de ingreso con formulario (usuario y contraseña) y un panel de acceso rápido con los usuarios habilitados.
- Valida el formulario, llama a la API, guarda la sesión y redirige a `/mesas`.
- Bloquea el ingreso de un usuario tras 5 contraseñas incorrectas, con cuenta regresiva en vivo.
- Permite buscar usuarios en tiempo real, recordar el último usuario y cambiar entre tema claro y oscuro.
- Es responsiva (móvil, tablet, escritorio y pantallas bajas) y funciona como PWA.
- Tiene un modo `mockup` que simula la API para ver el diseño sin backend.

## Estructura

```
features/auth/
├── README.md
├── index.ts                  exporta useSesion, useCerrarSesion y los tipos Perfil, Rol
├── types.ts                  Rol, Perfil, UsuarioLista
├── esquemas.ts               validación con zod (formulario y respuestas de la API)
├── api.ts                    iniciarSesion, listarUsuarios, cerrarSesion
├── hooks.ts                  useIniciarSesion, useUsuarios, useCerrarSesion
├── store.ts                  useSesion (perfil de la sesión)
├── almacenBloqueo.ts         useAlmacenBloqueo (intentos y bloqueo por usuario)
├── useBloqueo.ts             useBloqueo (cuenta regresiva) y formatoTiempo
├── useFormularioInicio.ts    toda la lógica del formulario
├── filtrarUsuarios.ts        filtrado del buscador
├── pages/
│   └── PaginaInicioSesion.tsx    compone la pantalla (unas 50 líneas)
└── components/
    ├── FondoInicio.tsx           fondo animado
    ├── MarcaCabecera.tsx         "Club de Campo" y botón de tema
    ├── FormularioInicio.tsx      formulario completo
    ├── CampoUsuario.tsx          campo de usuario con botón de borrar
    ├── CampoClave.tsx            campo de contraseña con ojo
    ├── BotonIngreso.tsx          botón "Siguiente" con sus estados y aviso sin conexión
    ├── estilosCampo.ts           clases compartidas de los campos
    ├── UsuarioPanel.tsx          panel de acceso rápido (md en adelante)
    ├── UsuarioCarrusel.tsx       carrusel táctil de acceso rápido (móvil)
    ├── BuscadorUsuarios.tsx      barra de búsqueda en tiempo real
    ├── FichaUsuario.tsx          ficha de cada usuario
    ├── ModalBloqueo.tsx          modal con la cuenta regresiva
    └── PieTarjeta.tsx            pie "AXON · © año"; al pulsar AXON abre el cuadro de instalación
```

Piezas compartidas que usa el login y viven fuera de la feature:

| Pieza | Ubicación |
|---|---|
| Cliente HTTP, JWT y renovación | `lib/http.ts` |
| Mensajes de error en español | `lib/mensajesError.ts` |
| Avisos de 3 segundos (`notificar`) | `shared/avisos/` |
| Modal base, aviso, cargador, superposición de carga | `shared/ui/` |
| Botón de tema y su estado | `shared/ui/CambiarTema.tsx`, `shared/hooks/useTema.ts` |
| Estado de conexión | `shared/hooks/useOnlineStatus.ts` |
| Datos de prueba | `simulados/` |
| Colores del login y tema oscuro | `styles/index.css` (variables `club-*`) |

## Flujo de ingreso

1. La persona escribe su usuario o toca una ficha del panel o del carrusel.
2. `useFormularioInicio` valida con zod (`esquemaFormularioInicio`) y envía con `useIniciarSesion`.
3. `iniciarSesion` hace `POST /auth/login` y valida la respuesta con `esquemaRespuestaInicio`.
4. Si sale bien:
   - se reinician los intentos de ese usuario;
   - el perfil se guarda en `useSesion`, el token de acceso queda en memoria y el de renovación en `sessionStorage`;
   - si la casilla "Recordar Credenciales" está marcada, se guarda el usuario;
   - se navega a `/mesas`.
5. Si falla, se muestra un aviso en español y se cuenta el intento (ver siguiente sección).

Un `401` fuera del login intenta renovar el token una vez; si no se puede, se cierra la sesión y se avisa "Sesión finalizada".

## Contrato con la API

Prefijo `/api/v1` (configurable con `VITE_API_URL`).

| Método y ruta | Respuesta esperada |
|---|---|
| `GET /auth/usuarios` | `[{ "usuario": "GP4", "nombre": "Piscina" }]` |
| `POST /auth/login` con `{ usuario, clave }` | `{ access_token, refresh_token, perfil: { usuario, nombre, local, rol } }` |
| `POST /auth/refresh` | `{ access_token }` |
| `POST /auth/logout` | cualquier cuerpo |

Roles válidos: `garzon`, `cajero`, `admin`. Los errores deben venir como `{ error: { code, message } }`. El código `CREDENCIALES_INVALIDAS` es el que cuenta como intento fallido (un `401` en el login sin código se trata igual).

## Bloqueo por intentos fallidos

Reglas (constantes en `almacenBloqueo.ts`):

- 5 intentos fallidos (`MAX_INTENTOS`) bloquean al usuario durante 5 minutos (`BLOQUEO_MS`).
- El bloqueo es por usuario: bloquear a GP4 no afecta a GP5.
- Si pasan 60 segundos sin otro fallo (`VENTANA_REINICIO_MS`), el contador vuelve a cero.
- Solo cuentan las credenciales incorrectas. Una conexión caída o un error del servidor no suman.
- Un ingreso correcto reinicia los intentos de ese usuario.

Comportamiento en pantalla:

- Cada fallo abre el aviso "Credenciales incorrectas" (3 segundos) con una barra de 5 segmentos y el texto de intentos restantes. Los intentos 1 y 2 salen en celeste; del 3.º en adelante, en rojo.
- Al quinto fallo se abre solo el modal de bloqueo.
- Con el usuario bloqueado, el campo de contraseña se deshabilita y el botón dice "Bloqueado · mm:ss" (con el tiempo corriendo). Al pulsarlo se abre el modal con el anillo de cuenta regresiva.
- El campo de usuario y las fichas siguen activos, así que se puede cambiar a otro usuario.
- Al terminar el tiempo se desbloquea solo y aparece el aviso "Bloqueo finalizado".

Persistencia: se guarda en `localStorage` con la clave `rt300-login-lock` (versión 1), con un registro por usuario (`intentos`, `bloqueadoHasta`, `ultimoFallo`). Sobrevive a recargas y se sincroniza entre pestañas con el evento `storage`.

Importante: este bloqueo vive solo en el navegador. Borrar los datos del sitio lo reinicia. La protección real debe hacerla el servidor limitando los intentos.

## Buscador de usuarios

- Barra de búsqueda en el panel (escritorio) y sobre el carrusel (móvil).
- Filtra mientras se escribe por código o por zona, sin distinguir mayúsculas ni tildes. Con varias palabras deben coincidir todas.
- El texto se escribe en mayúscula.
- El contador pasa de "19 MOZOS HABILITADOS" a "6 DE 19" al filtrar. Si no hay coincidencias muestra "Sin resultados para «TEXTO»".
- Enter elige el primer resultado, lo escribe en el campo de usuario y pasa a la contraseña (en móvil no envía el formulario). Escape o la X limpian la búsqueda.

## Instalación de la PWA

El ícono con "AXON" del pie de la tarjeta es un botón. Al pulsarlo se abre un cuadro (`shared/ui/ModalInstalacion.tsx`) cuyo contenido depende del estado de la app, que detecta `shared/hooks/useInstalarApp.ts`:

| Estado | Qué muestra |
|---|---|
| Instalable (el navegador ofrece instalar) | "¿Instalar RT - AXON?" con los botones "Instalar" y "Ahora no". Junto a AXON aparece un ícono de descarga |
| Ya instalada | "Ya tienes la app instalada" y si la estás usando como aplicación o si está en el dispositivo |
| iPhone (Safari no ofrece aviso) | Guía de tres pasos: Compartir, "Añadir a pantalla de inicio", "Añadir" |
| No disponible | Explica que, si ya la instalaste, la abras desde la pantalla de inicio; o que use el menú del navegador; o que hace falta HTTPS |

Cómo sabe si está instalada: por el modo de visualización (`standalone`), por el evento `appinstalled` y por una marca en `localStorage` (`rt300-app-instalada`). La marca se borra cuando el navegador vuelve a ofrecer la instalación, por ejemplo si la desinstalas.

Requisitos del navegador: HTTPS (o `localhost`) y la versión compilada, porque el service worker está desactivado en `npm run dev`. El nombre de la app es "RT - AXON" (`vite.config.ts` e `index.html`).

## Recordar usuario

La casilla "Recordar Credenciales" guarda el último usuario en `localStorage` (clave `rt300-last-user`) solo si el ingreso fue correcto. La próxima visita lo trae escrito y con la casilla marcada. Al desmarcarla y volver a ingresar, se borra.

## Modo mockup y producción

La variable está en `lib/env.ts`:

```ts
export const APP_MODE: AppMode = 'mockup'
```

- `'mockup'`: no se llama a la API. `simulados/adaptador.ts` responde `/auth/usuarios`, `/auth/login`, `/auth/refresh` y `/auth/logout` con 700 ms de espera.
- `'production'`: se llama a la API real.
- Al cambiar el valor, el servidor de desarrollo se reinicia solo. Para publicar, hay que volver a compilar.
- En producción no se incluye ningún código ni dato de prueba (se verificó en el resultado de la compilación).

Datos de prueba (`simulados/datos.ts`):

| Usuario | Contraseña |
|---|---|
| MCB y los usuarios GP (18 en total) | `123456` |
| PRUEBA | `prueba` |

En mockup, el modal de bloqueo muestra el botón "Reiniciar bloqueos (solo mockup)", que desbloquea a todos los usuarios al instante.

## Diseño

- Basado en la pantalla "Login Mozo" de Stitch (proyecto "Club Waiter Order App"), con la paleta del login en variables `club-*`.
- Tema claro y oscuro: el oscuro tiene fondo profundo, tarjeta con degradado y borde luminoso, y se ajustó con mediciones de contraste. Sigue el tema del dispositivo hasta que se elige uno a mano.
- Responsiva:
  - móvil: una columna con carrusel táctil de usuarios;
  - tablet y escritorio: dos columnas, con el panel que suma columnas según su ancho (consultas de contenedor);
  - pantallas bajas (`short`, hasta 520 px de alto): diseño compacto;
  - respeta las zonas seguras de los dispositivos con muesca.
- Cargas con el logo: modal de procesamiento durante el ingreso y pantalla de carga al cargar la lista de usuarios.
- Textos y errores en español. Los avisos se cierran solos a los 3 segundos.

## Convenciones del proyecto

- Archivos, funciones, componentes, hooks, constantes y tipos en español, excepto los nombres que define el README de arquitectura (`App`, `Button`, `Modal`, `http`, `queryClient`, `env`, etc.).
- Sin comentarios en el código.
- Sin puntos decorativos en la interfaz.

## Cómo probar

```bash
npm install
npm run dev
```

Abrir `http://localhost:5173/login` y probar:

1. Entrar con `GP4` y `123456`: debe llegar a `/mesas`.
2. Fallar 5 veces con otro usuario: el aviso cambia de celeste a rojo y al quinto se abre el modal de bloqueo.
3. Con ese usuario bloqueado, cambiar a otro y comprobar que puede entrar.
4. Esperar 60 segundos entre fallos y ver que el contador se reinicia.
5. Buscar "terraza" o "gp1" y pulsar Enter.
6. Cambiar el tema y recargar la página.
7. Reducir el ancho de la ventana para ver el carrusel móvil.

Comprobaciones de calidad:

```bash
npx tsc -b
npm run lint
npm run build
```

## Pendientes y observaciones

- El bloqueo por intentos debe reforzarse en el servidor.
- Del diseño de Stitch no se incluyeron el selector de turno, el panel de estadísticas ni el teclado numérico, porque no hay datos reales detrás.
- Los componentes `FichaUsuario` y `UsuarioPanel` conservan una propiedad `disabled` que el login ya no usa.
