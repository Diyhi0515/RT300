# Feature `pedidos`: mesas, cuentas y comandas

Pantallas de toma de pedidos del sistema RT-300: plano de mesas por área, panel de la mesa (ocupar, cuentas, comanda, imprimir, habilitar), datos de las cuentas y comanda nueva. También `/mesas` (Administración), que ahora muestra las mismas mesas reales.

Todo está conectado al backend real (`rt300-backend`). Los datos que se veían antes eran inventados y vivían en `simulados/`; esos archivos se conservan pero la aplicación ya no los usa.

## Qué hace

- **Pedidos (`/pedidos`)**: mesas del local agrupadas por área, en tarjetas o plano. Se actualiza solo cada 30 segundos (varios mozos trabajan a la vez).
- **Panel de la mesa**:
  - mesa libre: ocupar con comensales y cuentas (el mozo es el usuario que inició sesión);
  - mesa ocupada: cuentas con su consumo, nueva comanda, imprimir la cuenta, datos de la mesa (comensales y cuentas), datos de la cuenta (nombre), habilitar la mesa.
- **Datos cuentas (`/pedidos/cuentas/:mesa`)**: cliente, NIT y nombre de cada cuenta, con búsqueda en la agenda de clientes.
- **Comanda nueva**: menú real por secciones y subsecciones, cantidades y envío a cocina.
- **Administración (`/mesas`)**: indicadores del salón (ocupadas, libres, consumo abierto, ocupación) y cuadrícula de mesas; al tocar una mesa se abre en Pedidos.

## Estructura

```
features/pedidos/
├── README.md
├── types.ts            modelos de la interfaz (MesaPlano, MesaDetalle, Cuenta, Plato...)
├── esquemas.ts         validación con zod de las respuestas de la API
├── api.ts              una función por endpoint
├── mapeos.ts           respuesta de la API -> modelos de la interfaz
├── hooks.ts            consultas y mutaciones de TanStack Query
├── store.ts            solo estado de pantalla (área, mesa elegida, cuenta activa, comanda abierta)
├── calculos.ts         totales, conteos y tiempos
├── pages/              PedidosPage, DatosCuentasPage
└── components/         PlanoMesas, MesaTarjeta, MesaPlano, PanelMesa, FormularioOcupar, ResumenMesa, TodasLasCuentas, ComandaNueva...
```

Los datos del servidor viven en TanStack Query y el estado de pantalla en Zustand, como define `docs/02-frontend-react.md`. Al cerrar sesión se vacía la caché (`features/auth/store.ts`).

## Flujo de datos

| Hook | Endpoint | Notas |
|---|---|---|
| `useParametros` | `GET /salon/parametros` | áreas y área inicial del usuario; se guarda 10 min |
| `useMesas` | `GET /salon/mesas` | todas las mesas del local en una llamada; se refresca cada 30 s |
| `useDetalleFolio` | `GET /salon/folios/{folio}/detalle` | cuentas del folio con su consumo, solo para la mesa elegida |
| `useMesaDetalle` | (combina los dos anteriores) | una mesa con sus cuentas |
| `useOcuparMesa` | `POST /salon/mesas/{mesa}/ocupar` | el mesero lo pone el servidor (el del usuario) |
| `useModificarMesa` | `PATCH /salon/folios/{folio}` | comensales y cantidad de cuentas |
| `useActualizarCuenta` | `PUT /folios/{folio}/cuentas/{cuenta}` | nombre, cliente y NIT |
| `useHabilitarMesa` | `POST /salon/mesas/{mesa}/habilitar` | deja la mesa libre; el servidor la rechaza si tiene comandas |
| `useImprimirCuenta` | `POST /folios/{folio}/cuentas/{cuenta}/imprimir` | estado de cuenta de la cuenta activa |
| `useSecciones` | `GET /menu/secciones` | 18 secciones con 124 subsecciones; se guarda 10 min |
| `usePlatos` | `GET /menu/secciones/{s}/{ss}/platos` | `0` en la subsección = toda la sección |
| `useClientes` | `GET /clientes?nombre=&codigo=` | búsqueda en la agenda |
| `useEnviarComanda` | `POST /folios/{folio}/cuentas/{cuenta}/comandas` | solo `{ cart, cant }` por producto |

Después de cada mutación se invalidan las mesas y el folio afectado. Los errores del servidor los muestra el aviso global (`lib/queryClient.ts`) con el mensaje en español que envía el backend.

## Cómo se arma la comanda

El front envía solo el código del producto y la cantidad. **El precio, el centro de producción y los insumos los calcula el servidor** a partir de la base (con la lista de precios de la cuenta). Así un precio no se puede alterar desde el navegador, como pasaba en el sistema antiguo.

Si el producto no tiene centro de producción en el local, el servidor responde un error claro (`SIN_CENTRO_PRODUCCION`) y el aviso lo muestra.

Con el servicio de comandas en modo `fake` (desarrollo) la comanda se registra pero **no se imprime ni aparece en el consumo de la cuenta**, porque ese servicio es quien crea la comanda final.

## Reglas de negocio acordadas

| Decisión | Resultado |
|---|---|
| Reservar mesa y estado "reservada" | Se quitaron. La base solo tiene mesas libres y ocupadas |
| "Por cobrar" y "Liquidar cuenta" | Se quitaron. Pedir cuenta ahora es **Imprimir cuenta**. La liquidación la hace el módulo de caja |
| Agregar y quitar cuentas de a una | Se mantienen los botones. Agregar suma una cuenta. Quitar solo elimina la última y solo si la mesa no tiene consumo; el servidor valida igualmente |
| "Cuentas no pueden superar a comensales" | Se quitó (el sistema antiguo no la tiene) |

Una cuenta liquidada (la marca la caja) se muestra con su insignia y no permite nueva comanda.

## Mapeo de la API a la interfaz (`mapeos.ts`)

- Estado de la mesa: con folio -> `ocupada`; sin folio -> `libre`.
- Forma: hasta 4 sillas `redonda`, más de 4 `larga` (la base no guarda la forma).
- Apertura: fecha y hora del folio. En la copia de pruebas de la base las fechas son de julio, por eso el tiempo transcurrido sale en miles de horas.
- Mozo: nombre del mesero del folio (antes se mostraba el código).
- Cuenta: `cage` es el código del cliente (`0` = sin cliente), `estc = 9` es liquidada.

## Modo mockup

`APP_MODE = 'mockup'` (en `lib/env.ts`) activa el adaptador de `simulados/adaptador.ts`, que **solo cubre el login**. Las pantallas de esta feature llaman a endpoints que el adaptador no simula, así que en mockup mostrarán error. Los datos antiguos siguen en `simulados/pedidos.ts` y `simulados/salon.ts` (con sus propios tipos) por si se quiere ampliar el adaptador.

El build de producción ya no incluye datos de prueba (se comprobó que no aparecen platos, clientes ni tokens de ejemplo).

## Cómo probar

1. Levantar la base y el backend: `docker compose up -d db backend` (desde la raíz).
2. `npm run dev` y abrir `http://127.0.0.1:5173/login`.
3. Entrar con `GP1` / `123456`. Usuarios válidos: `GP1`, `GP2`, `GP5`, `GP6`.
4. En Pedidos: elegir una mesa libre, ocuparla, abrir Nueva comanda, elegir productos y enviar.
5. Al terminar, usar Habilitar mesa para dejarla libre. Las pruebas escriben en la copia de la base: ver `docs/03-puesta-en-marcha.md`.

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

### Pruebas automáticas (Vitest)

| Archivo | Qué comprueba |
|---|---|
| `mapeos.test.ts`, `calculos.test.ts` | Conversión API → interfaz y cálculos puros |
| `esquemas.test.ts` | Contrato: las respuestas reales del backend (`src/test/fixtures`, anonimizadas) cumplen los esquemas zod |
| `components/FormularioOcupar.test.tsx` | Ocupar mesa envía solo `{caco, ccom, ncta}` (el mesero lo pone el servidor) |
| `components/ComandaNueva.test.tsx` | Enviar comanda manda solo `{cart, cant}` (el precio lo decide el servidor) |
| `lib/http.test.ts` | Renovación de sesión, 401 simultáneos, errores y logout |

Las llamadas HTTP se simulan con msw (`src/test/servidor.ts`). Para renovar las fixtures con el backend encendido: `npm run fixtures`.
Flujo manual completo: [`docs/04-pruebas-locales.md`](../../../../docs/04-pruebas-locales.md).

## Pendientes

- Insumos modificables, extras y textos de la comanda (el backend ya los expone; la pantalla aún no).
- Eliminar y reimprimir comandas (panel ADMIN): el backend está listo, falta la pantalla.
- Búsqueda de productos en todo el menú (hoy busca dentro de la sección elegida).
- Imágenes de platos (`/menu/platos/{cart}/imagen`).
- Ampliar el adaptador del mockup a estas pantallas.
