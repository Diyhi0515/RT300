import { z } from 'zod'

const texto = z.union([z.string(), z.number()])

export const esquemaParametros = z.object({
  caco: z.number().nullish(),
  areas: z.array(z.object({ codigo: z.number(), descripcion: z.string().nullish() })),
})

export const esquemaMesaApi = z.object({
  mesa: z.string(),
  descripcion: z.string().nullish(),
  capacidad: z.number().nullish(),
  area: z.number().nullish(),
  estado: z.number().nullish(),
  folio: z.number().nullish(),
  comensales: z.number().nullish(),
  cven: texto.nullish(),
  mozo: z.string().nullish(),
  apertura: z.string().nullish(),
  cuentas: z.number().nullish(),
  consumo: z.number().nullish(),
})

export const esquemaRespuestaMesas = z.object({ mesas: z.array(esquemaMesaApi) })

export const esquemaLineaApi = z.object({
  cart: z.string(),
  descripcion: z.string().nullish(),
  pvta: z.number().nullish(),
  cant: z.number().nullish(),
})

export const esquemaCuentaApi = z.object({
  ncta: z.number(),
  nombre: z.string().nullish(),
  nruc: texto.nullish(),
  cage: texto.nullish(),
  estc: z.number().nullish(),
  lineas: z.array(esquemaLineaApi),
})

export const esquemaDetalleFolio = z.object({ cuentas: z.array(esquemaCuentaApi) })

export const esquemaOcupacion = z.object({ folio: z.number(), cuentas: z.number() })

export const esquemaClienteApi = z.object({
  codigo: z.number(),
  nombre: z.string().nullish(),
  nruc: texto.nullish(),
})

export const esquemaRespuestaClientes = z.object({ clientes: z.array(esquemaClienteApi) })

export const esquemaSecciones = z.object({
  secciones: z.array(
    z.object({ csme: z.number(), cssm: z.number(), descripcion: z.string().nullish() }),
  ),
})

export const esquemaPlatos = z.object({
  platos: z.array(
    z.object({
      cart: z.string(),
      cssm: z.number().nullish(),
      descripcion: z.string().nullish(),
      pvta: z.number(),
      moneda: z.string(),
    }),
  ),
})

export const esquemaComandaEnviada = z.object({
  ntmp: z.number(),
  comanda: texto.nullish(),
})

export type MesaApi = z.infer<typeof esquemaMesaApi>
export type CuentaApi = z.infer<typeof esquemaCuentaApi>
export type ClienteApi = z.infer<typeof esquemaClienteApi>

export const esquemaComandasMesa = z.object({
  comandas: z.array(
    z.object({
      ncom: z.number(),
      ncta: z.number().nullish(),
      cven: texto.nullish(),
      nomb: z.string().nullish(),
      impt: z.number().nullish(),
    }),
  ),
  detalle: z.array(
    z.object({
      ncom: z.number(),
      item: z.number(),
      ncta: z.number().nullish(),
      cart: z.string(),
      descripcion: z.string().nullish(),
      cant: z.number().nullish(),
      pvta: z.number().nullish(),
    }),
  ),
  motivos: z.array(z.object({ codigo: z.number(), descripcion: z.string().nullish() })),
})

export type ComandasMesaApi = z.infer<typeof esquemaComandasMesa>

export const esquemaAccionComanda = z.object({
  ntmp: z.number(),
  resultado: texto.nullish(),
})

export const esquemaExtras = z.object({
  extras: z.array(
    z.object({
      cart: z.string(),
      impt: z.number().nullish(),
      descripcion: z.string().nullish(),
      moneda: z.string().nullish(),
    }),
  ),
})

export const esquemaCentros = z.object({
  centros: z.array(z.object({ ccpd: texto, nombre: z.string() })),
})
