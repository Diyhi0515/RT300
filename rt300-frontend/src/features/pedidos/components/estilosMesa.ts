import { CalendarClock, Check, Receipt, Users, type LucideIcon } from 'lucide-react'
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
  reservada: {
    etiqueta: 'Reservada',
    icono: CalendarClock,
    insignia: 'bg-club-secondary/15 text-club-secondary',
    cuerpo:
      'border-dashed border-club-secondary bg-gradient-to-b from-surface to-club-secondary/20 text-club-secondary',
    silla: 'bg-club-secondary/45',
    barra: 'bg-club-secondary',
  },
  cobro: {
    etiqueta: 'Por cobrar',
    icono: Receipt,
    insignia: 'bg-accent-solid/20 text-amber-700 dark:text-amber-300',
    cuerpo:
      'border-accent-solid bg-gradient-to-b from-accent-solid to-amber-600 text-[#2a1a00] shadow-[0_10px_26px_rgba(245,159,11,.4)]',
    silla: 'bg-accent-solid/70',
    barra: 'bg-accent-solid',
  },
}

export const ordenEstados: EstadoMesaPlano[] = ['libre', 'ocupada', 'cobro', 'reservada']
