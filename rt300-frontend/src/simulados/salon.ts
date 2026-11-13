type EstadoMesa = 'libre' | 'ocupada' | 'reservada'

type EstadoPedido = 'pendiente' | 'preparando' | 'servido' | 'cobrado'

interface Mesa {
  numero: number
  zona: string
  capacidad: number
  estado: EstadoMesa
  comensales: number
  apertura: number | null
  garzon: string | null
}

interface Pedido {
  id: string
  mesa: number
  cliente: string
  platos: number
  total: number
  estado: EstadoPedido
  hora: number
}

const ZONAS = ['Terraza', 'Piscina', 'Salón', 'Jardín']
const GARZONES = ['GP1', 'GP3', 'GP5', 'GP7', 'GP9', 'GP11']
const CLIENTES = [
  'Familia Rojas',
  'Carlos Méndez',
  'Lucía Vargas',
  'Grupo Pérez',
  'Andrea Suárez',
  'Marcelo Antelo',
  'Familia Justiniano',
  'Rosa Ribera',
  'Jorge Salvatierra',
  'Daniela Soruco',
]

const hace = (minutos: number) => Date.now() - minutos * 60_000

export const crearMesas = (): Mesa[] =>
  Array.from({ length: 24 }, (_, i) => {
    const numero = i + 1
    const capacidad = [2, 4, 4, 6][i % 4]
    const patron = i % 6
    const estado =
      patron === 0 || patron === 2 || patron === 5
        ? 'ocupada'
        : patron === 3
          ? 'reservada'
          : 'libre'
    const ocupada = estado === 'ocupada'
    return {
      numero,
      zona: ZONAS[Math.floor(i / 6)],
      capacidad,
      estado,
      comensales: ocupada ? Math.max(1, capacidad - (i % 3)) : 0,
      apertura: ocupada ? hace(12 + ((i * 7) % 70)) : null,
      garzon: ocupada ? GARZONES[i % GARZONES.length] : null,
    }
  })

export const crearPedidos = (): Pedido[] => {
  const estados: Pedido['estado'][] = ['pendiente', 'preparando', 'servido', 'cobrado']
  return Array.from({ length: 12 }, (_, i) => ({
    id: `P-${1048 - i}`,
    mesa: ((i * 5) % 24) + 1,
    cliente: CLIENTES[i % CLIENTES.length],
    platos: 2 + ((i * 3) % 6),
    total: 95 + ((i * 47) % 380),
    estado: estados[i % 4],
    hora: hace(4 + i * 9),
  }))
}
