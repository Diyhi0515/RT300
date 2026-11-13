import { Check, Users, type LucideIcon } from 'lucide-react'
import type { EstadoMesaPlano } from '../types'

export interface EstiloEstadoMesa {
  etiqueta: string
  icono: LucideIcon
  insignia: string
  cuerpo: string
  silla: string
  barra: string
}

export const estilosMesa: Record<EstadoMesaPlano, EstiloEstadoMesa> = {
  libre: {
    etiqueta: 'Libre',
    icono: Check,
    insignia: 'bg-success/15 text-success',
    cuerpo: 'border-success/55 bg-gradient-to-b from-surface to-success/20 text-fg',
    silla: 'bg-success/55',
    barra: 'bg-success',
  },
  ocupada: {
    etiqueta: 'Ocupada',
    icono: Users,
    insignia: 'bg-club-pc/15 text-club-primary',
    cuerpo:
      'border-club-pc bg-gradient-to-b from-club-pc to-club-tertiary text-white shadow-[0_10px_26px_rgba(43,83,184,.45)]',
    silla: 'bg-club-pc/75',
    barra: 'bg-club-pc',
  },
}

export const ordenEstados: EstadoMesaPlano[] = ['libre', 'ocupada']
