import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  actualizarCuenta,
  buscarClientes,
  enviarComanda,
  habilitarMesa,
  imprimirCuenta,
  listarMesas,
  listarPlatos,
  listarSecciones,
  modificarFolio,
  obtenerDetalleFolio,
  obtenerParametros,
  ocuparMesa,
  type DatosActualizarCuenta,
  type DatosEnvioComanda,
  type DatosImprimir,
  type DatosModificar,
  type DatosOcupar,
  type FiltroClientes,
} from './api'
import { mapearArea, mapearCliente, mapearCuenta, mapearMesa, mapearSecciones } from './mapeos'
import { usePedidos } from './store'
import type { AreaConsumo, MesaDetalle, MesaPlano, Plato } from './types'

const REFRESCO_MS = 30_000

export const claves = {
  parametros: ['salon', 'parametros'] as const,
  mesas: ['salon', 'mesas'] as const,
  folio: (folio: number) => ['salon', 'folio', folio] as const,
  secciones: ['menu', 'secciones'] as const,
  platos: (seccion: number, subseccion: number) => ['menu', 'platos', seccion, subseccion] as const,
  clientes: (filtro: FiltroClientes) => ['clientes', filtro] as const,
}

export const useParametros = () =>
  useQuery({
    queryKey: claves.parametros,
    queryFn: obtenerParametros,
    staleTime: 10 * 60_000,
    select: (datos) => ({
      areaInicial: datos.caco ? String(datos.caco) : null,
      areas: datos.areas.map(mapearArea),
    }),
  })

export const useAreas = (): AreaConsumo[] => useParametros().data?.areas ?? []

export const useAreaActual = (): AreaConsumo | null => {
  const parametros = useParametros()
  const elegida = usePedidos((s) => s.areaId)
  const areas = parametros.data?.areas ?? []
  const id = elegida ?? parametros.data?.areaInicial ?? areas[0]?.id ?? null
  return areas.find((a) => a.id === id) ?? areas[0] ?? null
}

export const useMesas = () =>
  useQuery({
    queryKey: claves.mesas,
    queryFn: listarMesas,
    staleTime: 10_000,
    refetchInterval: REFRESCO_MS,
    select: (mesas) => mesas.map(mapearMesa),
  })

export const useDetalleFolio = (folio: number) =>
  useQuery({
    queryKey: claves.folio(folio),
    queryFn: () => obtenerDetalleFolio(folio),
    enabled: folio > 0,
    staleTime: 5_000,
    refetchInterval: REFRESCO_MS,
    select: (cuentas) => cuentas.map(mapearCuenta),
  })

export const useMesaDetalle = (codigo: string | null) => {
  const mesas = useMesas()
  const base: MesaPlano | null = mesas.data?.find((m) => m.codigo === codigo) ?? null
  const detalle = useDetalleFolio(base?.folio ?? 0)
  const mesa = useMemo<MesaDetalle | null>(
    () => (base ? { ...base, cuentas: detalle.data ?? [] } : null),
    [base, detalle.data],
  )
  return {
    mesa,
    cargandoMesas: mesas.isPending,
    cargandoCuentas: !!base && base.folio > 0 && detalle.isPending,
  }
}

export const useSecciones = () =>
  useQuery({
    queryKey: claves.secciones,
    queryFn: listarSecciones,
    staleTime: 10 * 60_000,
    select: mapearSecciones,
  })

const aPlato = (p: { cart: string; descripcion?: string | null; pvta: number; moneda: string }): Plato => ({
  id: p.cart.trim(),
  nombre: p.descripcion?.trim() || p.cart.trim(),
  precio: p.pvta,
  moneda: p.moneda,
})

export const usePlatos = (seccion: number | null, subseccion: number) =>
  useQuery({
    queryKey: claves.platos(seccion ?? 0, subseccion),
    queryFn: () => listarPlatos(seccion as number, subseccion),
    enabled: seccion !== null,
    staleTime: 5 * 60_000,
    select: (platos) => platos.map(aPlato),
  })

export const useClientes = (filtro: FiltroClientes | null) =>
  useQuery({
    queryKey: claves.clientes(filtro ?? {}),
    queryFn: () => buscarClientes(filtro as FiltroClientes),
    enabled: filtro !== null,
    staleTime: 60_000,
    select: (clientes) => clientes.map(mapearCliente),
  })

const useRefrescar = () => {
  const cliente = useQueryClient()
  return (folio?: number) => {
    void cliente.invalidateQueries({ queryKey: claves.mesas })
    if (folio) void cliente.invalidateQueries({ queryKey: claves.folio(folio) })
  }
}

export const useOcuparMesa = () => {
  const refrescar = useRefrescar()
  return useMutation({
    mutationFn: ({ mesa, ...datos }: DatosOcupar & { mesa: string }) => ocuparMesa(mesa, datos),
    onSuccess: () => refrescar(),
  })
}

export const useHabilitarMesa = () => {
  const refrescar = useRefrescar()
  return useMutation({
    mutationFn: ({ mesa }: { mesa: string; folio: number }) => habilitarMesa(mesa),
    onSuccess: (_datos, { folio }) => refrescar(folio),
  })
}

export const useModificarMesa = () => {
  const refrescar = useRefrescar()
  return useMutation({
    mutationFn: ({ folio, ...datos }: DatosModificar & { folio: number }) =>
      modificarFolio(folio, datos),
    onSuccess: (_datos, { folio }) => refrescar(folio),
  })
}

export const useActualizarCuenta = () => {
  const refrescar = useRefrescar()
  return useMutation({
    mutationFn: ({
      folio,
      cuenta,
      ...datos
    }: DatosActualizarCuenta & { folio: number; cuenta: number }) =>
      actualizarCuenta(folio, cuenta, datos),
    onSuccess: (_datos, { folio }) => refrescar(folio),
  })
}

export const useEnviarComanda = () => {
  const refrescar = useRefrescar()
  return useMutation({
    mutationFn: ({
      folio,
      cuenta,
      ...datos
    }: DatosEnvioComanda & { folio: number; cuenta: number }) =>
      enviarComanda(folio, cuenta, datos),
    onSuccess: (_datos, { folio }) => refrescar(folio),
  })
}

export const useImprimirCuenta = () =>
  useMutation({
    mutationFn: ({ folio, cuenta, ...datos }: DatosImprimir & { folio: number; cuenta: number }) =>
      imprimirCuenta(folio, cuenta, datos),
  })
