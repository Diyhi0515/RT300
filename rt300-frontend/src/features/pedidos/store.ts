import { create } from 'zustand'
import { useSesion } from '@/features/auth'

interface EstadoPedidos {
  areaId: string | null
  seleccionada: string | null
  cuentaActiva: number | null
  elegirArea: (id: string) => void
  seleccionar: (codigo: string | null) => void
  abrirCuenta: (numero: number | null) => void
  mostrarMesa: (codigo: string, areaId: string) => void
}

const estadoInicial = () => ({
  areaId: null,
  seleccionada: null,
  cuentaActiva: null,
})

export const usePedidos = create<EstadoPedidos>((set) => ({
  ...estadoInicial(),
  elegirArea: (id) => set({ areaId: id, seleccionada: null, cuentaActiva: null }),
  seleccionar: (codigo) => set({ seleccionada: codigo, cuentaActiva: null }),
  abrirCuenta: (numero) => set({ cuentaActiva: numero }),
  mostrarMesa: (codigo, areaId) => set({ areaId, seleccionada: codigo, cuentaActiva: null }),
}))

useSesion.subscribe((estado, previo) => {
  if (previo.perfil && !estado.perfil) usePedidos.setState(estadoInicial())
})
