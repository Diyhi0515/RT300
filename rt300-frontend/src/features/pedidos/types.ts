export type EstadoMesaPlano = 'libre' | 'ocupada' | 'reservada' | 'cobro'

export type FormaMesa = 'redonda' | 'larga'

export type CategoriaMenu = 'entradas' | 'fuertes' | 'bebidas' | 'postres'

export interface AreaConsumo {
  id: string
  nombre: string
  prefijo: string
}

export interface LineaCuenta {
  id: string
  platoId: string
  nombre: string
  cantidad: number
  precio: number
  nota?: string
}

export interface Cuenta {
  numero: number
  nombre: string
  codigoCliente?: string
  nit?: string
  liquidada: boolean
  lineas: LineaCuenta[]
}

export interface ClienteRegistrado {
  codigo: string
  nombre: string
  nit: string
}

export interface DatosCuenta {
  nombre: string
  codigoCliente: string
  nit: string
}

export interface MesaPlano {
  codigo: string
  areaId: string
  capacidad: number
  forma: FormaMesa
  estado: EstadoMesaPlano
  comensales: number
  apertura: number | null
  mozo: string | null
  folio: number
  cuentas: Cuenta[]
}

export interface Plato {
  id: string
  nombre: string
  detalle: string
  precio: number
  categoria: CategoriaMenu
}

export interface ItemComanda {
  plato: Plato
  cantidad: number
}
