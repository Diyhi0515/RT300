# Administración

Área solo para el rol `admin`. Ruta base `/admin`; entra desde el módulo **Administración** de `/inicio` (los demás roles no lo ven y, si escriben la URL, vuelven a `/inicio`).

## Secciones

| Ruta | Pantalla | Datos (endpoints existentes, solo lectura) |
|---|---|---|
| `/admin` | Panel: indicadores del salón y cuadrícula de mesas. Tocar una mesa abre su **detalle de solo lectura** (mozo, apertura, cuentas y productos) con un botón secundario "Abrir en Pedidos" | `GET /salon/mesas`, `/salon/parametros` |
| `/admin/mesas` | Mesas en servicio (el código de la mesa abre el mismo detalle): ocupadas, de la más antigua a la más reciente, con mozo, comensales, cuentas y consumo | `GET /salon/mesas` |
| `/admin/menu` | Menú: secciones, subsecciones, productos y precios con búsqueda | `GET /menu/secciones`, `/menu/secciones/{s}/{ss}/platos` |
| `/admin/clientes` | Clientes: búsqueda por nombre (mín. 2 letras) o código, con espera de 350 ms | `GET /clientes` |

En el menú lateral hay 4 entradas bloqueadas ("Próximamente"): Liberar mesa, Comandas (eliminar/reimprimir), Usuarios y roles, Reportes. Para activarlas hay que agregar la entrada en `secciones.ts`, su ruta en `app/router.tsx` y, si escribe, el endpoint de admin en el backend.

## Estructura

```
admin/
├── secciones.ts              Entradas del menú lateral (activas y próximas)
├── busqueda.ts               Regla pura: código numérico o nombre de 2+ letras
├── components/BarraLateral   Sidebar fijo en escritorio, cajón con botón "Menú" en móvil (Escape lo cierra)
├── components/EncabezadoSeccion
└── pages/                    Una pantalla por sección
```

El layout está en `app/layouts/AdminLayout.tsx` y la protección en `RequerirRol` (`app/guardas.tsx`).
Reutiliza los hooks de `features/pedidos/hooks.ts`, por lo que comparte caché con la toma de pedidos.

## Seguridad

La protección del front es solo de comodidad: **la autoridad es el backend**. Hoy estas pantallas solo leen, y los endpoints de lectura los puede llamar cualquier usuario del mismo local. Cuando se agreguen acciones de escritura (liberar mesa, eliminar comanda) el backend debe exigir el rol `admin`.

## Probar

Con el backend en Docker, define en `.env` `ADMIN_USERS=GP2` (usuario de prueba), reinicia el backend (`docker compose up -d backend`), cierra sesión y entra con `GP2` / `123456`. Los usuarios sin ese rol no ven el módulo.
Pruebas automáticas: `npm test` (guarda de rol, módulos por rol, mesas en servicio, búsqueda de clientes).
