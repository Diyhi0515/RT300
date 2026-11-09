import { create } from 'zustand'
import type { Tono } from '@/shared/ui/tonos'

export const DURACION_AVISO = 3000

export type IconoAviso = 'shield'

export interface ProgresoAviso {
  actual: number
  total: number
  label: string
}

export interface Aviso {
  id: number
  tone: Tono
  title: string
  message?: string
  duration: number
  icon?: IconoAviso
  progress?: ProgresoAviso
}

interface EntradaAviso {
  tone: Tono
  title: string
  message?: string
  duration?: number
  icon?: IconoAviso
  progress?: ProgresoAviso
}

interface EstadoAvisos {
  notice: Aviso | null
  show: (input: EntradaAviso) => void
  dismiss: () => void
}

let counter = 0

export const useAvisos = create<EstadoAvisos>((set) => ({
  notice: null,
  show: ({ duration = DURACION_AVISO, ...rest }) =>
    set({ notice: { id: ++counter, duration, ...rest } }),
  dismiss: () => set({ notice: null }),
}))

const emitir = (tone: Tono, title: string, message?: string) =>
  useAvisos.getState().show({ tone, title, message })

export const notificar = {
  error: (message: string, title = 'Ocurrió un problema') => emitir('danger', title, message),
  advertencia: (message: string, title = 'Atención') => emitir('warning', title, message),
  exito: (message: string, title = 'Listo') => emitir('success', title, message),
  informacion: (message: string, title = 'Información') => emitir('info', title, message),
}
