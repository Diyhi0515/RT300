import { CalendarClock, Check, Users, type LucideIcon } from 'lucide-react'
import type { EstadoMesa } from '../types'

interface Estilo {
  etiqueta: string
  icono: LucideIcon
  clases: string
}

const MESA: Record<EstadoMesa, Estilo> = {
  libre: {
    etiqueta: 'Libre',
    icono: Check,
    clases: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  ocupada: {
    etiqueta: 'Ocupada',
    icono: Users,
    clases: 'bg-primary/10 text-primary',
  },
  reservada: {
    etiqueta: 'Reservada',
    icono: CalendarClock,
    clases: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  },
}

interface InsigniaEstadoProps {
  estado: EstadoMesa
}

export function InsigniaEstado({ estado }: InsigniaEstadoProps) {
  const { etiqueta, icono: Icono, clases } = MESA[estado]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${clases}`}
    >
      <Icono className="size-3.5 shrink-0" aria-hidden />
      {etiqueta}
    </span>
  )
}
