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
└── components/         ComandasMesaModal, AutorizarComanda, NotaProductoModal, ExtrasProductoModal, CentroProduccionModal, PlanoMesas, MesaTarjeta, MesaPlano, PanelMesa, FormularioOcupar, ResumenMesa, TodasLasCuentas, CategoriasComanda, ProductosComanda, ResumenComanda...
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

Borrador temporal: lo elegido (productos y cantidades) se guarda en `sessionStorage` por folio y cuenta (`borradorComanda.ts`), así sobrevive a recargar la pestaña. Se borra al registrar la comanda, al confirmar "Salir sin registrar" y vence a las 12 horas. Se pierde al cerrar la pestaña.

Con el servicio de comandas en modo `fake` (desarrollo) la comanda se registra pero **no se imprime ni aparece en el consumo de la cuenta**, porque ese servicio es quien crea la comanda final.

## Reglas de negocio acordadas

| Decisión | Resultado |
|---|---|
| Reservar mesa y estado "reservada" | Se quitaron. La base solo tiene mesas libres y ocupadas |
| "Por cobrar" y "Liquidar cuenta" | Se quitaron. Pedir cuenta ahora es **Imprimir cuenta**. La liquidación la hace el módulo de caja |
| Agregar y quitar cuentas de a una | Se mantienen los botones. Agregar suma una cuenta. Quitar solo elimina la última y solo si la mesa no tiene consumo; el servidor valida igualmente |
| "Cuentas no pueden superar a comensales" | **Se mantiene** (corregido 2026-11-13: el sistema antiguo sí la tiene en `RT300a.js`, al ocupar y al modificar la mesa). El contador de cuentas se detiene en el número de comensales, los comensales no bajan de las cuentas, y agregar una cuenta de más avisa. El servidor también la valida (`422 CUENTAS_MAYOR_COMENSALES`) |

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
| `pages/ComandaPage.test.tsx` | Registrar comanda manda solo `{cart, cant}` (el precio lo decide el servidor) |
| `components/ComandasMesaModal.test.tsx` | Listar, elegir y reimprimir o eliminar comandas con autorizador (la clave solo para eliminar) |
| `api.test.ts` | El envío de la comanda se valida antes de salir y solo manda código y cantidad |
| `borradorComanda.test.ts` | Borrador temporal de la comanda: guarda, recupera, borra y vence a las 12 horas |
| `lib/http.test.ts` | Renovación de sesión, 401 simultáneos, errores y logout |

Las llamadas HTTP se simulan con msw (`src/test/servidor.ts`). Para renovar las fixtures con el backend encendido: `npm run fixtures`.
Flujo manual completo: [`docs/04-pruebas-locales.md`](../../../../docs/04-pruebas-locales.md).

## Comandas de la mesa (eliminar y reimprimir)

Botón "Comandas de la mesa" en el resumen de la mesa. Usa `GET /folios/{nfol}/comandas?mesa=`, `POST /comandas/reimprimir` y `POST /comandas/eliminar`. Se eligen productos, un motivo y un usuario autorizador; eliminar pide además la clave del autorizador (campo de contraseña, no se guarda y se borra al cerrar o si falla). Sin comandas vigentes el backend responde `SIN_COMANDAS` y la pantalla lo muestra como lista vacía. El fixture `src/test/fixtures/comandas-mesa.json` es armado a mano con datos ficticios, no capturado.

## Seguridad en el front

El navegador no es de fiar: cualquier cosa se puede cambiar desde el inspector, así que el servidor decide siempre (precios, permisos, autorizador). El front solo reduce el daño:

- Lo que se envía se valida con zod antes de salir (`api.ts`): solo `cart` y `cant` (1 a 99), de 1 a 100 productos; los campos extra se descartan.
- Los controladores vuelven a comprobar lo que el botón deshabilita (comanda vacía, doble envío, máximos), por si se quita el atributo `disabled` desde el inspector.
- El borrador de `sessionStorage` se valida con zod al leerlo y se descarta si trae cantidades, precios, textos o claves alterados.
- La clave del autorizador no se guarda en ningún almacenamiento ni se escribe en consola.
- No sustituye al backend: eso (autorización, límites de intentos, precios) sigue en el servidor.

## Detalle de cada producto en el resumen

Cada producto del resumen tiene: **Nota** (texto libre de hasta 100 caracteres, va en `glos`), **Extras** (`GET /menu/secciones/{csme}/{cssm}/extras`, se envían como `extras:[{cart,cant}]`), **Centro** de producción (`GET /menu/platos/{cart}/centros-produccion`, se envía como `ccpd`; sin elegir, el servidor usa el del local) y **Eliminar**. "Vaciar comanda" quita todo con confirmación. Eliminar y vaciar son solo del front: la comanda aún no está registrada, así que no hay API que llamar (como `Limpiar` del sistema antiguo). Los precios de los extras en pantalla son una referencia; el servidor los calcula al registrar.

## Vista previa del pedido

Botón debajo de "Registrar comanda". Muestra el pedido como texto de 40 columnas, basado en la vista previa del sistema antiguo (`funcionTextoVisualizar` de `RT300c.js`): `PEDIDO DE MESA` centrado, mesa, cuenta y cliente; por cada producto su nombre (partido en líneas de 40) y debajo `cantidad x precio = subtotal`; las notas salen como `++ texto`, los extras como `  + nombre` con su propio cálculo, y al final `TOTAL = importe` (con extras). Los importes llevan coma decimal y punto de miles. Es un texto armado en el front (`textoVistaPrevia` en `calculos.ts`): no registra nada, no se imprime y los precios son los que muestra la pantalla (el servidor los vuelve a calcular al registrar).

## Pendientes

- Insumos modificables y textos predefinidos de la comanda (el backend ya los expone; la pantalla aún no).
- Búsqueda de productos en todo el menú (hoy busca dentro de la sección elegida).
- Imágenes de platos (`/menu/platos/{cart}/imagen`).
- Ampliar el adaptador del mockup a estas pantallas.

## Restricciones del sistema antiguo y dónde se cumplen aquí

Revisadas contra `RT300a/b/c/303 .js y .php` (2026-11-13). "Servidor" significa que se exige en el backend aunque el front falle o lo salten.

| Restricción del sistema antiguo | Dónde se cumple ahora |
|---|---|
| Cuentas no pueden superar a comensales (al ocupar y al modificar) | Servidor `422 CUENTAS_MAYOR_COMENSALES` + contadores del front |
| Al menos 1 comensal, 1 cuenta y un mesero | Servidor (`COMENSALES_INVALIDOS`, `SIN_MESERO`) |
| Mesa eliminada, deshabilitada, ya ocupada o en unión no se puede ocupar | Servidor (`MESA_ELIMINADA`, `MESA_DESHABILITADA`, `MESA_OCUPADA`, `MESA_EN_UNION`) |
| Datos de cuenta solo en mesa ocupada del mismo folio | Servidor (`MESA_NO_OCUPADA`, `CUENTA_NO_EXISTE`) |
| No quitar cuentas si hay comandas o notas de venta | Servidor (`CUENTAS_CON_COMANDAS`, `CUENTAS_CON_NOTA`) + el front solo ofrece quitar la última cuenta sin consumo |
| No habilitar una mesa con comandas vigentes | Servidor |
| Cuenta liquidada no admite comandas ("Cta: liquidada.") | Servidor (la cuenta debe estar abierta) + botón desactivado en el front |
| Comanda con al menos 1 producto y cantidad mayor a 0 | Servidor (1 a 100 líneas, cantidad 1 a 99) + botón desactivado sin productos |
| Producto existente, con precio y centro de producción del local | Servidor (`PLATO_NO_EXISTE`, `SIN_PRECIO`, centro de producción) |
| "Confirma: Guardar Comanda?" antes de enviar | Front: diálogo "¿Registrar la comanda?" (agregado el 2026-11-13) |
| Cliente debe existir en la agenda | Servidor (`CLIENTE_NO_EXISTE`) |
| Eliminar comanda: motivo y clave del autorizador | Servidor (la pantalla aún no existe) |
| Cada usuario solo ve su local | Servidor (`OTRO_LOCAL`), nuevo respecto al sistema antiguo |

Pendiente de comparar cuando existan las pantallas: "una comanda con insumos debe tener por lo menos un insumo" (`RT300c.js`, edición de insumos) y la eliminación de comandas.
