import { useRef, useState } from 'react'
import { Building2, Check, ChevronDown } from 'lucide-react'
import { areas } from '@/simulados/pedidos'
import { useClickExterior } from '@/shared/hooks/useClickExterior'
import { resumenMesas } from '../calculos'
import { usePedidos } from '../store'

interface DesplegableAreaProps {
  local: string
}

export function DesplegableArea({ local }: DesplegableAreaProps) {
  const mesas = usePedidos((s) => s.mesas)
  const areaId = usePedidos((s) => s.areaId)
  const elegirArea = usePedidos((s) => s.elegirArea)
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)
  useClickExterior(contenedor, abierto, () => setAbierto(false))

  const actual = areas.find((a) => a.id === areaId)

  return (
    <div ref={contenedor} className="relative min-w-0 max-w-full">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
        className={`inline-flex h-10 max-w-full cursor-pointer items-center gap-2 rounded-xl border bg-surface pl-3.5 pr-3 text-sm font-bold uppercase shadow-sm transition active:scale-95 ${
          abierto ? 'border-club-pc ring-4 ring-club-pc/15' : 'border-line hover:border-club-pc/50'
        }`}
      >
        <Building2 className="size-4 shrink-0 text-primary" aria-hidden />
        <span className="truncate">
          {local} · {actual?.nombre}
        </span>
        <ChevronDown
          className={`size-4 text-muted transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {abierto && (
        <ul
          role="listbox"
          aria-label="Áreas de consumo"
          className="absolute left-0 top-[calc(100%+8px)] z-30 w-72 max-w-[calc(100vw-2rem)] uppercase animate-[pop_0.18s_ease-out] overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-[0_24px_60px_rgba(1,21,38,.25)]"
        >
          {areas.map((area) => {
            const { ocupadas, total } = resumenMesas(mesas.filter((m) => m.areaId === area.id))
            const activa = area.id === areaId
            return (
              <li key={area.id} role="option" aria-selected={activa}>
                <button
                  type="button"
                  onClick={() => {
                    elegirArea(area.id)
                    setAbierto(false)
                  }}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 uppercase text-left transition active:scale-[0.98] ${
                    activa ? 'bg-club-pc/10 text-club-primary' : 'text-fg hover:bg-primary/5'
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold leading-tight">{area.nombre}</span>
                    <span className="block text-[11px] tabular-nums text-muted">
                      {ocupadas} de {total} ocupadas
                    </span>
                  </span>
                  {activa && <Check className="size-4 shrink-0" aria-hidden />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
