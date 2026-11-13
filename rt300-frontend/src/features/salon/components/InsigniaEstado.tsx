import { Check, Users, type LucideIcon } from 'lucide-react'
import type { EstadoMesaPlano } from '@/features/pedidos/types'

interface Estilo {
  etiqueta: string
  icono: LucideIcon
  clases: string
}

const MESA: Record<EstadoMesaPlano, Estilo> = {
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
}

interface InsigniaEstadoProps {
  estado: EstadoMesaPlano
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
