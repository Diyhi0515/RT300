export type EstadoMesaPlano = 'libre' | 'ocupada'

export type FormaMesa = 'redonda' | 'larga'

export interface AreaConsumo {
  id: string
  nombre: string
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
  codigoMozo: number | null
  folio: number
  numeroCuentas: number
  consumo: number
}

export interface MesaDetalle extends MesaPlano {
  cuentas: Cuenta[]
}

export interface SubseccionMenu {
  codigo: number
  nombre: string
}

export interface SeccionMenu {
  codigo: number
  nombre: string
  subsecciones: SubseccionMenu[]
}

export interface Plato {
  id: string
  nombre: string
  precio: number
  moneda: string
}

export interface ItemComanda {
  plato: Plato
  cantidad: number
}
