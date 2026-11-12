export type EstadoMesa = 'libre' | 'ocupada' | 'reservada'

export type EstadoPedido = 'pendiente' | 'preparando' | 'servido' | 'cobrado'

export interface Mesa {
  numero: number
  zona: string
  capacidad: number
  estado: EstadoMesa
  comensales: number
  apertura: number | null
  garzon: string | null
}

export interface Pedido {
  id: string
  mesa: number
  cliente: string
  platos: number
  total: number
  estado: EstadoPedido
  hora: number
}
