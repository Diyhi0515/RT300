import { useMemo, useState } from 'react'
import { LayoutGrid, Search, Users, X } from 'lucide-react'
import { useAreas, useMesas } from '@/features/pedidos/hooks'
import type { EstadoMesaPlano, MesaPlano } from '@/features/pedidos/types'
import { tiempoTranscurrido } from '../formato'
import { InsigniaEstado } from './InsigniaEstado'

type Filtro = 'todas' | EstadoMesaPlano

const FILTROS: { valor: Filtro; etiqueta: string }[] = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'libre', etiqueta: 'Libres' },
  { valor: 'ocupada', etiqueta: 'Ocupadas' },
]

const BORDE: Record<EstadoMesaPlano, string> = {
  libre: 'border-emerald-500/30 hover:border-emerald-500/70',
  ocupada: 'border-primary/40 bg-primary/[0.06] hover:border-primary',
}

interface CuadriculaMesasProps {
  ayuda: string
  alElegir: (mesa: MesaPlano) => void
}

export function CuadriculaMesas({ ayuda, alElegir }: CuadriculaMesasProps) {
  const consulta = useMesas()
  const areas = useAreas()
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [busqueda, setBusqueda] = useState('')
  const mesas = useMemo(() => consulta.data ?? [], [consulta.data])

  const nombres = useMemo(() => new Map(areas.map((a) => [a.id, a.nombre])), [areas])
  const nombreArea = (id: string) => nombres.get(id) ?? ''

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return mesas.filter(
      (m) =>
        (filtro === 'todas' || m.estado === filtro) &&
        (!texto ||
          m.codigo.toLowerCase().includes(texto) ||
          (nombres.get(m.areaId) ?? '').toLowerCase().includes(texto)),
    )
  }, [mesas, nombres, filtro, busqueda])

  const conteo = (valor: Filtro) =>
    valor === 'todas' ? mesas.length : mesas.filter((m) => m.estado === valor).length

  return (
    <section className="overflow-hidden rounded-2xl border border-line border-t-4 border-t-[#1b8ef2] bg-surface shadow-[0_12px_32px_rgba(1,21,38,.06)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 short:py-2.5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <LayoutGrid className="size-5" />
          </span>
          <div>
            <h2 className="font-bold">Salón</h2>
            <p className="text-xs text-muted">{ayuda}</p>
          </div>
        </div>
        <label className="relative w-full sm:w-64">
          <span className="sr-only">Buscar mesa o zona</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar mesa o zona"
            className="h-10 w-full rounded-xl border border-line bg-bg pl-9 pr-9 text-base outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10 [&::-webkit-search-cancel-button]:hidden"
          />
          {busqueda && (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => setBusqueda('')}
              className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-muted transition hover:bg-primary/10"
            >
              <X className="size-4" />
            </button>
          )}
        </label>
      </header>

      <div
        role="tablist"
        aria-label="Filtrar mesas por estado"
        className="flex gap-2 overflow-x-auto px-4 py-3 short:py-2"
      >
        {FILTROS.map(({ valor, etiqueta }) => {
          const activo = filtro === valor
          return (
            <button
              key={valor}
              type="button"
              role="tab"
              aria-selected={activo}
              onClick={() => setFiltro(valor)}
              className={`inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition active:scale-95 ${
                activo
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : 'border border-line text-muted hover:border-primary/50 hover:text-fg'
              }`}
            >
              {etiqueta}
              <span
                className={`rounded-md px-1.5 text-[11px] tabular-nums ${
                  activo ? 'bg-white/20' : 'bg-line/60'
                }`}
              >
                {conteo(valor)}
              </span>
            </button>
          )
        })}
      </div>

      {consulta.isPending ? (
        <p role="status" className="px-4 pb-8 pt-4 text-center text-sm text-muted">
          Cargando mesas...
        </p>
      ) : consulta.isError ? (
        <p role="alert" className="px-4 pb-8 pt-4 text-center text-sm text-muted">
          No se pudieron cargar las mesas.{' '}
          <button
            type="button"
            onClick={() => void consulta.refetch()}
            className="cursor-pointer font-bold text-primary underline"
          >
            Reintentar
          </button>
        </p>
      ) : visibles.length === 0 ? (
        <p className="px-4 pb-8 pt-4 text-center text-sm text-muted">
          No hay mesas que coincidan con la búsqueda.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pb-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 short:grid-cols-4 short:gap-2">
          {visibles.map((m, i) => (
            <button
              key={m.codigo}
              type="button"
              onClick={() => alElegir(m)}
              style={{ animationDelay: `${Math.min(i, 18) * 25}ms` }}
              className={`flex animate-[chip-in_0.35s_ease-out_both] cursor-pointer flex-col gap-2 rounded-2xl border bg-surface p-3 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 short:gap-1 short:p-2 ${BORDE[m.estado]}`}
            >
              <span className="flex items-start justify-between gap-2">
                <strong className="text-2xl font-bold leading-none tabular-nums short:text-xl">
                  {m.codigo.slice(-2)}
                </strong>
                <InsigniaEstado estado={m.estado} />
              </span>
              <span className="truncate text-xs text-muted">{nombreArea(m.areaId)}</span>
              <span className="flex items-center gap-1 text-xs font-medium">
                <Users className="size-3.5 text-primary" />
                {m.estado === 'ocupada' ? `${m.comensales}/${m.capacidad}` : m.capacidad}
                {m.estado === 'ocupada' && m.apertura && (
                  <span className="ml-auto truncate text-[11px] text-muted">
                    {tiempoTranscurrido(m.apertura)}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
