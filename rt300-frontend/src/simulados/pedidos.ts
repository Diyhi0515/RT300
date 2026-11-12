import type {
  AreaConsumo,
  CategoriaMenu,
  ClienteRegistrado,
  Cuenta,
  MesaPlano,
  Plato,
} from '@/features/pedidos/types'

export const areas: AreaConsumo[] = [
  { id: 'planta-baja', nombre: 'Planta baja', prefijo: 'HPB' },
  { id: 'planta-alta', nombre: 'Planta alta', prefijo: 'HPA' },
  { id: 'terraza', nombre: 'Terraza', prefijo: 'HTZ' },
  { id: 'barra', nombre: 'Barra', prefijo: 'HBR' },
]

const CANTIDAD_POR_AREA: Record<string, number> = {
  'planta-baja': 20,
  'planta-alta': 16,
  terraza: 14,
  barra: 8,
}

const CAPACIDADES = [2, 4, 4, 6, 2, 4, 8, 4]

const MOZOS = ['GP1', 'GP3', 'GP5', 'GP7', 'GP9', 'GP11']

const CLIENTES = [
  'Familia Rojas',
  'Carlos Méndez',
  'Lucía Vargas',
  'Grupo Pérez',
  'Andrea Suárez',
  'Marcelo Antelo',
  'Rosa Ribera',
  'Jorge Salvatierra',
]

export const clientes: ClienteRegistrado[] = [
  { codigo: 'C001', nombre: 'Rosa Ribera', nit: '4521873' },
  { codigo: 'C002', nombre: 'Carlos Méndez', nit: '6012945' },
  { codigo: 'C003', nombre: 'Lucía Vargas', nit: '7834120' },
  { codigo: 'C004', nombre: 'Familia Rojas', nit: '3345671' },
  { codigo: 'C005', nombre: 'Marcelo Antelo', nit: '5598032' },
  { codigo: 'C006', nombre: 'Andrea Suárez', nit: '8120456' },
  { codigo: 'C007', nombre: 'Jorge Salvatierra', nit: '2987654' },
  { codigo: 'C008', nombre: 'Grupo Pérez', nit: '1023456789' },
  { codigo: 'C009', nombre: 'Inversiones Oriente S.R.L.', nit: '1028890021' },
  { codigo: 'C010', nombre: 'Patricia Egüez', nit: '6677123' },
]

const hace = (minutos: number) => Date.now() - minutos * 60_000

export const catalogo: Plato[] = [
  {
    id: 'e1',
    nombre: 'Sopa de maní',
    detalle: 'Con papas fritas y perejil',
    precio: 28,
    categoria: 'entradas',
  },
  {
    id: 'e2',
    nombre: 'Salteñas',
    detalle: 'Porción de 2 unidades',
    precio: 18,
    categoria: 'entradas',
  },
  {
    id: 'e3',
    nombre: 'Ensalada mixta',
    detalle: 'Hojas verdes, tomate y palta',
    precio: 32,
    categoria: 'entradas',
  },
  {
    id: 'e4',
    nombre: 'Empanadas de queso',
    detalle: 'Porción de 3 unidades',
    precio: 24,
    categoria: 'entradas',
  },
  {
    id: 'f1',
    nombre: 'Silpancho',
    detalle: 'Carne apanada, arroz, papa y huevo',
    precio: 58,
    categoria: 'fuertes',
  },
  {
    id: 'f2',
    nombre: 'Pique macho',
    detalle: 'Carne, salchicha y papas al horno',
    precio: 72,
    categoria: 'fuertes',
  },
  {
    id: 'f3',
    nombre: 'Churrasco',
    detalle: 'Lomo a la parrilla con guarnición',
    precio: 85,
    categoria: 'fuertes',
  },
  {
    id: 'f4',
    nombre: 'Pollo a la plancha',
    detalle: 'Con arroz y ensalada fresca',
    precio: 55,
    categoria: 'fuertes',
  },
  {
    id: 'f5',
    nombre: 'Trucha al ajillo',
    detalle: 'Con puré rústico y verduras',
    precio: 78,
    categoria: 'fuertes',
  },
  {
    id: 'b1',
    nombre: 'Cerveza Paceña',
    detalle: 'Botella de 620 ml',
    precio: 25,
    categoria: 'bebidas',
  },
  {
    id: 'b2',
    nombre: 'Jugo natural',
    detalle: 'Naranja, limonada o maracuyá',
    precio: 18,
    categoria: 'bebidas',
  },
  { id: 'b3', nombre: 'Gaseosa', detalle: 'Botella personal', precio: 12, categoria: 'bebidas' },
  { id: 'b4', nombre: 'Agua mineral', detalle: 'Con o sin gas', precio: 8, categoria: 'bebidas' },
  {
    id: 'b5',
    nombre: 'Mocochinchi',
    detalle: 'Refresco tradicional',
    precio: 10,
    categoria: 'bebidas',
  },
  {
    id: 'p1',
    nombre: 'Helado artesanal',
    detalle: 'Dos bochas a elección',
    precio: 20,
    categoria: 'postres',
  },
  {
    id: 'p2',
    nombre: 'Flan de leche',
    detalle: 'Con caramelo casero',
    precio: 18,
    categoria: 'postres',
  },
  {
    id: 'p3',
    nombre: 'Brownie tibio',
    detalle: 'Con helado de vainilla',
    precio: 22,
    categoria: 'postres',
  },
]

export const categoriasMenu: { id: CategoriaMenu; etiqueta: string }[] = [
  { id: 'entradas', etiqueta: 'Entradas' },
  { id: 'fuertes', etiqueta: 'Platos fuertes' },
  { id: 'bebidas', etiqueta: 'Bebidas' },
  { id: 'postres', etiqueta: 'Postres' },
]

const platoPorId = (id: string) => catalogo.find((p) => p.id === id) as Plato

const cuentaConConsumo = (
  numero: number,
  nombre: string,
  consumos: [string, number, string?][],
): Cuenta => ({
  numero,
  nombre,
  codigoCliente: clientes.find((c) => c.nombre === nombre)?.codigo ?? '',
  nit: clientes.find((c) => c.nombre === nombre)?.nit ?? '',
  liquidada: false,
  lineas: consumos.map(([platoId, cantidad, nota], i) => {
    const plato = platoPorId(platoId)
    return {
      id: `${numero}-${platoId}-${i}`,
      platoId,
      nombre: plato.nombre,
      cantidad,
      precio: plato.precio,
      nota,
    }
  }),
})

const cuentasVacias = (cantidad: number): Cuenta[] =>
  Array.from({ length: cantidad }, (_, i) => ({
    numero: i + 1,
    nombre: `Cuenta ${i + 1}`,
    liquidada: false,
    lineas: [],
  }))

let folioSiguiente = 1043

const generarMesas = (): MesaPlano[] =>
  areas.flatMap((area, a) =>
    Array.from({ length: CANTIDAD_POR_AREA[area.id] }, (_, i) => {
      const capacidad =
        area.id === 'barra' ? 1 + (i % 2) : CAPACIDADES[(i + a) % CAPACIDADES.length]
      const forma = capacidad >= 6 ? 'larga' : 'redonda'
      const patron = (i + a * 2) % 7
      const base: MesaPlano = {
        codigo: `${area.prefijo}${String(i + 1).padStart(2, '0')}`,
        areaId: area.id,
        capacidad,
        forma,
        estado: 'libre',
        comensales: 0,
        apertura: null,
        mozo: null,
        folio: 0,
        cuentas: [],
      }
      if (patron === 0 || patron === 3) {
        const comensales = Math.max(1, capacidad - (i % 2))
        const consumos: [string, number, string?][] = [
          ['f1', 1, 'Sin cebolla'],
          ['b2', 1],
          ['e2', 1],
        ]
        const cuentas = cuentasVacias(Math.min(comensales, 1 + (i % 3)))
        cuentas[0] = cuentaConConsumo(1, CLIENTES[(i + a) % CLIENTES.length], consumos)
        if (cuentas[1])
          cuentas[1] = cuentaConConsumo(2, `Cuenta 2`, [
            ['f4', 1],
            ['b3', 2],
          ])
        return {
          ...base,
          estado: 'ocupada',
          comensales,
          apertura: hace(10 + ((i * 11 + a * 7) % 80)),
          mozo: MOZOS[(i + a) % MOZOS.length],
          folio: folioSiguiente++,
          cuentas,
        }
      }
      if (patron === 5) {
        const cuentas = cuentasVacias(1)
        cuentas[0] = cuentaConConsumo(1, CLIENTES[(i + 3) % CLIENTES.length], [
          ['f3', 2],
          ['b1', 2],
          ['p3', 1],
        ])
        return {
          ...base,
          estado: 'cobro',
          comensales: Math.max(2, capacidad - 1),
          apertura: hace(70 + ((i * 5) % 40)),
          mozo: MOZOS[(i + a + 2) % MOZOS.length],
          folio: folioSiguiente++,
          cuentas,
        }
      }
      if (patron === 6) return { ...base, estado: 'reservada' }
      return base
    }),
  )

export const crearMesasPlano = (): MesaPlano[] =>
  generarMesas().map((mesa) => {
    if (mesa.codigo !== 'HPB04') return mesa
    const cuentas = cuentasVacias(10)
    cuentas[0] = cuentaConConsumo(1, 'Familia Rojas', [
      ['f1', 2],
      ['b2', 2],
    ])
    cuentas[1] = cuentaConConsumo(2, 'Carlos Méndez', [
      ['f3', 1, 'Término: 3/4 · Papas fritas'],
      ['b1', 1],
    ])
    cuentas[2] = {
      ...cuentaConConsumo(3, 'Lucía Vargas', [
        ['e2', 1],
        ['p1', 1],
      ]),
      liquidada: true,
    }
    cuentas[3] = cuentaConConsumo(4, 'Cuenta 4', [['f4', 1]])
    return {
      ...mesa,
      estado: 'ocupada',
      capacidad: 10,
      comensales: 10,
      apertura: hace(52),
      mozo: MOZOS[0],
      folio: 1042,
      cuentas,
    }
  })
