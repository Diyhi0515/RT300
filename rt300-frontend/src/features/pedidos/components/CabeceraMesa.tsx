import { Hash, X } from 'lucide-react'
import { useAreas } from '../hooks'
import { usePedidos } from '../store'
import type { MesaPlano } from '../types'
import { estilosMesa } from './estilosMesa'

interface CabeceraMesaProps {
  mesa: MesaPlano
  cerrable?: boolean
}

export function CabeceraMesa({ mesa, cerrable = false }: CabeceraMesaProps) {
  const seleccionar = usePedidos((s) => s.seleccionar)
  const estilo = estilosMesa[mesa.estado]
  const Icono = estilo.icono
  const area = useAreas().find((a) => a.id === mesa.areaId)

  return (
    <header className="relative overflow-hidden border-b border-line px-5 pb-4 pt-5 short:py-3">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(43,83,184,0.14),transparent_60%)]" />
      <div className="relative flex items-center gap-3.5">
        <span
          className={`grid size-14 shrink-0 place-items-center rounded-2xl border-2 text-lg font-extrabold short:size-11 ${estilo.cuerpo}`}
        >
          {mesa.codigo.slice(-2)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xl font-extrabold leading-tight tracking-tight">
            Mesa {mesa.codigo}
          </h3>
          <p className="truncate text-xs text-muted">
            {area?.nombre} · {mesa.capacidad} {mesa.capacidad === 1 ? 'persona' : 'personas'}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${estilo.insignia}`}
            >
              <Icono className="size-3.5" aria-hidden />
              {estilo.etiqueta}
            </span>
            {mesa.folio > 0 && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-club-pc/10 px-2 py-1 text-[11px] font-bold text-club-primary">
                <Hash className="size-3.5" aria-hidden />
                Comanda {mesa.folio}
              </span>
            )}
          </div>
        </div>
        {cerrable && (
          <button
            type="button"
            onClick={() => seleccionar(null)}
            aria-label="Cerrar panel de la mesa"
            className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl text-muted transition hover:bg-primary/10 hover:text-fg active:scale-95"
          >
            <X className="size-5" />
          </button>
        )}
      </div>
    </header>
  )
}
