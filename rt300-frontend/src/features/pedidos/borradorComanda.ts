import { z } from 'zod'
import {
  MAXIMO_CANTIDAD_PRODUCTO,
  MAXIMO_EXTRAS_PRODUCTO,
  MAXIMO_NOTA_PRODUCTO,
  MAXIMO_PRODUCTOS_COMANDA,
} from './limites'
import type { ItemComanda } from './types'

const VIGENCIA_MS = 12 * 60 * 60 * 1000

const texto = (maximo: number) => z.string().max(maximo)

const esquemaItem = z.object({
  plato: z.object({
    id: texto(30).min(1),
    nombre: texto(120),
    precio: z.number().finite().min(0).max(1_000_000),
    moneda: texto(8),
    subseccion: z.number().int().optional(),
  }),
  cantidad: z.number().int().min(1).max(MAXIMO_CANTIDAD_PRODUCTO),
  categoria: texto(120).optional(),
  subcategoria: texto(120).optional(),
  seccion: z.number().int().min(0).optional(),
  nota: texto(MAXIMO_NOTA_PRODUCTO).optional(),
  centro: z.object({ codigo: z.number().int().min(0), nombre: texto(120) }).optional(),
  extras: z
    .array(
      z.object({
        codigo: texto(30).min(1),
        nombre: texto(120),
        precio: z.number().finite().min(0).max(1_000_000),
        cantidad: z.number().int().min(1).max(MAXIMO_CANTIDAD_PRODUCTO),
      }),
    )
    .max(MAXIMO_EXTRAS_PRODUCTO)
    .optional(),
  orden: z.number().int().min(0).optional(),
})

const esquemaBorrador = z.object({
  guardadoEn: z.number(),
  items: z
    .record(z.string(), esquemaItem)
    .refine((items) => Object.keys(items).length <= MAXIMO_PRODUCTOS_COMANDA)
    .refine((items) => Object.entries(items).every(([clave, item]) => clave === item.plato.id)),
})

const claveDe = (folio: number | string, cuenta: number) =>
  `rt300:borrador-comanda:${folio}:${cuenta}`

export const borrarBorrador = (folio: number | string, cuenta: number) => {
  try {
    sessionStorage.removeItem(claveDe(folio, cuenta))
  } catch {
    return
  }
}

export const leerBorrador = (
  folio: number | string,
  cuenta: number,
): Record<string, ItemComanda> => {
  try {
    const crudo = sessionStorage.getItem(claveDe(folio, cuenta))
    if (!crudo) return {}
    const resultado = esquemaBorrador.safeParse(JSON.parse(crudo))
    if (!resultado.success || Date.now() - resultado.data.guardadoEn > VIGENCIA_MS) {
      borrarBorrador(folio, cuenta)
      return {}
    }
    return resultado.data.items
  } catch {
    return {}
  }
}

export const guardarBorrador = (
  folio: number | string,
  cuenta: number,
  items: Record<string, ItemComanda>,
) => {
  try {
    if (Object.keys(items).length === 0) {
      sessionStorage.removeItem(claveDe(folio, cuenta))
      return
    }
    sessionStorage.setItem(
      claveDe(folio, cuenta),
      JSON.stringify({ guardadoEn: Date.now(), items }),
    )
  } catch {
    return
  }
}
