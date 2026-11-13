import { http } from '@/lib/http'
import {
  esquemaComandaEnviada,
  esquemaDetalleFolio,
  esquemaOcupacion,
  esquemaParametros,
  esquemaPlatos,
  esquemaRespuestaClientes,
  esquemaRespuestaMesas,
  esquemaSecciones,
} from './esquemas'

const enRuta = (valor: string) => encodeURIComponent(valor)

export const obtenerParametros = async () => {
  const { data } = await http.get('/salon/parametros')
  return esquemaParametros.parse(data)
}

export const listarMesas = async () => {
  const { data } = await http.get('/salon/mesas')
  return esquemaRespuestaMesas.parse(data).mesas
}

export const obtenerDetalleFolio = async (folio: number) => {
  const { data } = await http.get(`/salon/folios/${folio}/detalle`)
  return esquemaDetalleFolio.parse(data).cuentas
}

export interface DatosOcupar {
  caco: number
  ccom: number
  ncta: number
}

export const ocuparMesa = async (mesa: string, datos: DatosOcupar) => {
  const { data } = await http.post(`/salon/mesas/${enRuta(mesa)}/ocupar`, datos)
  return esquemaOcupacion.parse(data)
}

export const habilitarMesa = async (mesa: string) => {
  await http.post(`/salon/mesas/${enRuta(mesa)}/habilitar`)
}

export interface DatosModificar {
  ccom: number
  ncta: number
}

export const modificarFolio = async (folio: number, datos: DatosModificar) => {
  await http.patch(`/salon/folios/${folio}`, datos)
}

export interface DatosActualizarCuenta {
  mesa: string
  cage: number
  nruc: string
  nomb: string
}

export const actualizarCuenta = async (
  folio: number,
  cuenta: number,
  datos: DatosActualizarCuenta,
) => {
  await http.put(`/folios/${folio}/cuentas/${cuenta}`, datos)
}

export interface FiltroClientes {
  nombre?: string
  codigo?: number
}

export const buscarClientes = async (filtro: FiltroClientes) => {
  const { data } = await http.get('/clientes', { params: filtro })
  return esquemaRespuestaClientes.parse(data).clientes
}

export const listarSecciones = async () => {
  const { data } = await http.get('/menu/secciones')
  return esquemaSecciones.parse(data).secciones
}

export const listarPlatos = async (seccion: number, subseccion: number) => {
  const { data } = await http.get(`/menu/secciones/${seccion}/${subseccion}/platos`)
  return esquemaPlatos.parse(data).platos
}

export interface ItemEnvio {
  cart: string
  cant: number
}

export interface DatosEnvioComanda {
  glos: string
  items: ItemEnvio[]
}

export const enviarComanda = async (folio: number, cuenta: number, datos: DatosEnvioComanda) => {
  const { data } = await http.post(`/folios/${folio}/cuentas/${cuenta}/comandas`, datos)
  return esquemaComandaEnviada.parse(data)
}

export interface DatosImprimir {
  mesa: string
  cven: string
  caco: string
}

export const imprimirCuenta = async (folio: number, cuenta: number, datos: DatosImprimir) => {
  await http.post(`/folios/${folio}/cuentas/${cuenta}/imprimir`, datos)
}
