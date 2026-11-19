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
  subseccion?: number
}

export interface ExtraElegido {
  codigo: string
  nombre: string
  precio: number
  cantidad: number
}

export interface CentroElegido {
  codigo: number
  nombre: string
}

export interface ItemComanda {
  plato: Plato
  cantidad: number
  categoria?: string
  subcategoria?: string
  seccion?: number
  nota?: string
  centro?: CentroElegido
  extras?: ExtraElegido[]
  orden?: number
}

export interface ExtraMenu {
  codigo: string
  nombre: string
  precio: number
  moneda: string
}

export interface CentroProduccion {
  codigo: number
  nombre: string
}

export interface ItemComandaMesa {
  comanda: number
  item: number
  cuenta: number | null
  codigo: string
  descripcion: string
  cantidad: number
  precio: number
}

export interface ComandaMesa {
  numero: number
  cuenta: number | null
  garzon: string
  importe: number
  items: ItemComandaMesa[]
}

export interface MotivoComanda {
  codigo: number
  descripcion: string
}

export interface ComandasMesa {
  comandas: ComandaMesa[]
  motivos: MotivoComanda[]
}
