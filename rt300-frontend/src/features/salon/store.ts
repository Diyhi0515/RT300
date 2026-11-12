import { create } from 'zustand'
import { useSesion } from '@/features/auth'
import { crearMesas, crearPedidos } from '@/simulados/salon'
import type { Mesa, Pedido } from './types'

interface EstadoSalon {
  mesas: Mesa[]
  pedidos: Pedido[]
  ocupar: (numero: number, comensales: number, garzon: string) => void
  liberar: (numero: number) => void
  reservar: (numero: number) => void
  habilitar: (numero: number) => void
}

const actualizarMesa = (mesas: Mesa[], numero: number, cambios: Partial<Mesa>) =>
  mesas.map((m) => (m.numero === numero ? { ...m, ...cambios } : m))

export const useSalon = create<EstadoSalon>((set) => ({
  mesas: crearMesas(),
  pedidos: crearPedidos(),
  ocupar: (numero, comensales, garzon) =>
    set((s) => {
      const siguiente = Number(s.pedidos[0]?.id.slice(2) ?? 1000) + 1
      const nuevo: Pedido = {
        id: `P-${siguiente}`,
        mesa: numero,
        cliente: `Mesa ${numero}`,
        platos: comensales,
        total: comensales * 68,
        estado: 'pendiente',
        hora: Date.now(),
      }
      return {
        mesas: actualizarMesa(s.mesas, numero, {
          estado: 'ocupada',
          comensales,
          apertura: Date.now(),
          garzon,
        }),
        pedidos: [nuevo, ...s.pedidos],
      }
    }),
  liberar: (numero) =>
    set((s) => ({
      mesas: actualizarMesa(s.mesas, numero, {
        estado: 'libre',
        comensales: 0,
        apertura: null,
        garzon: null,
      }),
      pedidos: s.pedidos.map((p) => (p.mesa === numero ? { ...p, estado: 'cobrado' } : p)),
    })),
  reservar: (numero) =>
    set((s) => ({ mesas: actualizarMesa(s.mesas, numero, { estado: 'reservada' }) })),
  habilitar: (numero) =>
    set((s) => ({ mesas: actualizarMesa(s.mesas, numero, { estado: 'libre' }) })),
}))

useSesion.subscribe((estado, previo) => {
  if (previo.perfil && !estado.perfil) {
    useSalon.setState({ mesas: crearMesas(), pedidos: crearPedidos() })
  }
})
