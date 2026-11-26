# RT - AXON: frontend

Aplicación web (PWA) del sistema RT-300 para mozos y administración: ingreso, mesas, cuentas y comandas. Se conecta al backend `rt300-backend` (Flask). La arquitectura completa está en [`docs/02-frontend-react.md`](../docs/02-frontend-react.md).

Stack: React 19, TypeScript, Vite, React Router, TanStack Query, Zustand, Axios, Tailwind CSS v4, Zod, motion, Vitest con Testing Library y MSW.

## Rutas

| Ruta | Pantalla | Feature |
|---|---|---|
| `/login` | Ingreso de mozos | `auth` |
| `/inicio` | Módulos disponibles según el rol | `inicio` |
| `/pedidos` | Mesas (tarjetas y plano), panel de la mesa | `pedidos` |
| `/pedidos/cuentas/:codigo` | Datos de las cuentas y clientes | `pedidos` |
| `/pedidos/comanda/:codigo/:cuenta` | Nueva comanda | `pedidos` |
| `/admin`, `/admin/mesas`, `/admin/menu`, `/admin/clientes` | Administración (solo rol `admin`) | `admin` |

## Estructura

```
src/
├── app/          arranque, rutas, guardas y layouts
├── features/     auth, inicio, pedidos, salon, admin (cada una con su README cuando lo necesita)
├── shared/       ui, hooks y avisos usados por varias features
├── lib/          http (Axios y sesión), queryClient, env, utilidades
├── simulados/    adaptador y datos del modo mockup (solo el login)
├── styles/       index.css: tokens del tema claro y oscuro y variantes de Tailwind
└── test/         servidor MSW, fixtures anonimizadas y utilidades de prueba
```

Documentación por feature:

- [`features/auth/README.md`](src/features/auth/README.md): ingreso, bloqueo por intentos, instalación de la PWA.
- [`features/pedidos/README.md`](src/features/pedidos/README.md): mesas, cuentas y comandas.
- [`features/admin/README.md`](src/features/admin/README.md): área de administración.

## Cómo ejecutarlo

Requisitos: Node.js y el backend encendido en `http://127.0.0.1:5000` (ver [`docs/03-puesta-en-marcha.md`](../docs/03-puesta-en-marcha.md)). El servidor de desarrollo redirige `/api` a ese puerto.

```bash
npm install
npm run dev
```

Se abre en `http://127.0.0.1:5173/login`. El usuario `GP1` con contraseña `123456` es solo de la copia de pruebas local.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run typecheck` | Revisa los tipos (`tsc -b`) |
| `npm run lint` | ESLint |
| `npm test` | Pruebas con Vitest |
| `npm run build` | Compila para producción (tipos, Vite, PWA) |
| `npm run preview` | Sirve la versión compilada |
| `npm run fixtures` | Renueva las fixtures de `src/test/fixtures` con el backend encendido |

Después de modificar archivos, el formato del proyecto se aplica con `npx prettier --no-semi --single-quote --print-width 100 --write <archivos>` (no hay archivo de configuración de Prettier).

## Variables

- `VITE_API_URL`: dirección de la API (por defecto `/api/v1`). Se lee de la carpeta general del proyecto.
- `APP_MODE` en `src/lib/env.ts`: `'production'` llama a la API real; `'mockup'` solo simula el login.

## Interfaz

- **Responsive:** celular, tablet y escritorio, en vertical y horizontal. Cortes: `md` 768 px y `lg` 960 px (se redefinió respecto al valor por defecto de Tailwind para que tablets de unos 975 px usen el diseño de tablet). Las variantes `short` (pantallas bajas: hasta 520 px de alto, o desde 768 px de ancho con hasta 820 px de alto, como laptops y tablets en horizontal) y `apaisado` (alto máximo de 520 px) están definidas en `src/styles/index.css` y explicadas en el README de `pedidos`.
- **Tema:** claro y oscuro con variables CSS (`--bg`, `--surface`, `--primary`...), consumidas como tokens de Tailwind. El cambio de tema es instantáneo.
- **Avisos:** los avisos se cierran solos a los 3 segundos. Los modales de aviso, de procesamiento, de bloqueo y de instalación usan el mismo diseño apilado en vertical y horizontal.
- **Búsquedas:** los campos de búsqueda escriben en mayúscula.

## Convenciones

- Archivos, funciones, componentes, hooks, constantes y tipos nuevos en español, salvo los nombres que fija la arquitectura (`App`, `AppLayout`, `Providers`, `router`, `Button`, `Modal`, `EmptyState`, `useOnlineStatus`, `http`, `queryClient`, `env`).
- Sin comentarios en el código.
- Sin puntos ni indicadores circulares decorativos en la interfaz.
- Datos del servidor con TanStack Query; Zustand solo para estado de pantalla; cálculos puros en `calculos.ts`; validación con Zod.
- Cada cambio relevante se anota en el README de la feature y en [`docs/CAMBIOS.md`](../docs/CAMBIOS.md).
