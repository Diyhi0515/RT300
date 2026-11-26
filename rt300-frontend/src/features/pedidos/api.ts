import { z } from 'zod'
import { ErrorApi, http } from '@/lib/http'
import {
  esquemaAccionComanda,
  esquemaComandaEnviada,
  esquemaCentros,
  esquemaComandasMesa,
  esquemaExtras,
  esquemaDetalleFolio,
  esquemaOcupacion,
  esquemaParametros,
  esquemaPlatos,
  esquemaRespuestaClientes,
  esquemaRespuestaMesas,
  esquemaSecciones,
} from './esquemas'
import {
  MAXIMO_CANTIDAD_PRODUCTO,
  MAXIMO_EXTRAS_PRODUCTO,
  MAXIMO_NOTA_PRODUCTO,
  MAXIMO_PRODUCTOS_COMANDA,
} from './limites'

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

export const eliminarCuentas = async (folio: number, mesa: string, cuentas: number[]) => {
  if (cuentas.length === 1) {
    await http.delete(`/folios/${folio}/cuentas/${cuentas[0]}`, { params: { mesa } })
    return
  }
  await http.post(`/folios/${folio}/cuentas/eliminar`, { mesa, cuentas })
}

export const compactarCuentas = async (folio: number, mesa: string) => {
  await http.post(`/folios/${folio}/cuentas/compactar`, { mesa })
}

export interface FiltroClientes {
  nombre?: string
  codigo?: number
  documento?: string
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
  glos?: string
  ccpd?: number
  extras?: { cart: string; cant: number }[]
}

export interface DatosEnvioComanda {
  glos: string
  items: ItemEnvio[]
}

const esquemaEnvioComanda = z.object({
  glos: z.string().max(200),
  items: z
    .array(
      z.object({
        cart: z.string().trim().min(1).max(30),
        cant: z.number().int().min(1).max(MAXIMO_CANTIDAD_PRODUCTO),
        glos: z.string().trim().max(MAXIMO_NOTA_PRODUCTO).optional(),
        ccpd: z.number().int().min(0).optional(),
        extras: z
          .array(
            z.object({
              cart: z.string().trim().min(1).max(30),
              cant: z.number().int().min(1).max(MAXIMO_CANTIDAD_PRODUCTO),
            }),
          )
          .max(MAXIMO_EXTRAS_PRODUCTO)
          .optional(),
      }),
    )
    .min(1)
    .max(MAXIMO_PRODUCTOS_COMANDA),
})

export const enviarComanda = async (folio: number, cuenta: number, datos: DatosEnvioComanda) => {
  const cuerpo = esquemaEnvioComanda.parse(datos)
  const { data } = await http.post(`/folios/${folio}/cuentas/${cuenta}/comandas`, cuerpo)
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

export const listarComandasMesa = async (folio: number, mesa: string) => {
  try {
    const { data } = await http.get(`/folios/${folio}/comandas`, { params: { mesa } })
    return esquemaComandasMesa.parse(data)
  } catch (error) {
    if (error instanceof ErrorApi && error.code === 'SIN_COMANDAS') {
      return esquemaComandasMesa.parse({ comandas: [], detalle: [], motivos: [] })
    }
    throw error
  }
}

export interface ReferenciaItemComanda {
  ncom: number
  item: number
}

export interface DatosReimprimirComandas {
  nfol: number
  mesa: string
  uaut: string
  mtvo: number
  items: ReferenciaItemComanda[]
}

export interface DatosEliminarComandas extends DatosReimprimirComandas {
  cont: string
}

export const reimprimirComandas = async (datos: DatosReimprimirComandas) => {
  const { data } = await http.post('/comandas/reimprimir', datos)
  return esquemaAccionComanda.parse(data)
}

export const eliminarComandas = async (datos: DatosEliminarComandas) => {
  const { data } = await http.post('/comandas/eliminar', datos)
  return esquemaAccionComanda.parse(data)
}

export const listarExtras = async (seccion: number, subseccion: number) => {
  const { data } = await http.get(`/menu/secciones/${seccion}/${subseccion}/extras`)
  return esquemaExtras.parse(data).extras
}

export const listarCentros = async (cart: string) => {
  const { data } = await http.get(`/menu/platos/${enRuta(cart)}/centros-produccion`)
  return esquemaCentros.parse(data).centros
}

export const obtenerModoImpresion = async () => {
  const { data } = await http.get('/health')
  return z.object({ impresion: z.enum(['simulada', 'real']) }).parse(data).impresion
}

export const subirImagenPlato = async (cart: string, archivo: File) => {
  const formulario = new FormData()
  formulario.append('imagen', archivo)
  const { data } = await http.post(`/menu/platos/${enRuta(cart)}/imagen`, formulario, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60_000,
  })
  return z.object({ cart: z.string(), imagen: z.string() }).parse(data)
}
