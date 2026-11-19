import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, Minus, Plus, Search, X } from 'lucide-react'
import { formatoMoneda } from '@/features/salon/formato'
import { usePlatos } from '../hooks'
import type { ItemComanda, Plato, SeccionMenu } from '../types'
import { IconoSeccion } from './IconoSeccion'
import { ModalSubsecciones } from './ModalSubsecciones'

interface ProductosComandaProps {
  seccion: SeccionMenu
  subseccion: number
  busqueda: string
  elegidos: Record<string, ItemComanda>
  alCambiarSubseccion: (codigo: number) => void
  alCambiarBusqueda: (texto: string) => void
  alCambiarCantidad: (plato: Plato, delta: number) => void
  alVolver: () => void
  lateral?: ReactNode
}

const boton =
  'grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl transition active:scale-90 short:size-9 lg:size-11'

export function ProductosComanda({
  seccion,
  subseccion,
  busqueda,
  elegidos,
  alCambiarSubseccion,
  alCambiarBusqueda,
  alCambiarCantidad,
  alVolver,
  lateral,
}: ProductosComandaProps) {
  const [verSubsecciones, setVerSubsecciones] = useState(false)
  const listaSubsecciones = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listaSubsecciones.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView?.({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [subseccion])
  const platos = usePlatos(seccion.codigo, subseccion)
  const texto = busqueda.trim().toLowerCase()
  const visibles = (platos.data ?? []).filter(
    (p) => !texto || p.nombre.toLowerCase().includes(texto) || p.id.toLowerCase().includes(texto),
  )

  return (
    <section aria-label={`Productos de ${seccion.nombre}`}>
      <div className="pb-3 pt-1 short:pb-2">
        <div className="flex items-center gap-2.5 lg:gap-3.5">
          <button
            type="button"
            onClick={alVolver}
            aria-label="Volver a las categorías"
            className={`${boton} border border-line bg-surface text-fg hover:border-primary/50`}
          >
            <ChevronLeft className="size-5" />
          </button>
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-club-pc to-club-tertiary text-white shadow-md shadow-club-pc/30 short:size-9 lg:size-12">
            <IconoSeccion nombre={seccion.nombre} className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-base font-extrabold uppercase leading-tight [overflow-wrap:anywhere] sm:text-lg lg:text-2xl">
              {seccion.nombre}
            </h2>
            <button
              type="button"
              onClick={alVolver}
              className="cursor-pointer text-xs font-semibold text-club-primary hover:underline lg:text-sm"
            >
              Cambiar de categoría
            </button>
          </div>
        </div>
      </div>

      <div className="sticky top-[73px] z-20 -mx-4 space-y-2 bg-bg px-4 pb-1 pt-1 short:top-[57px] short:space-y-1">
        <label className="relative block">
          <span className="sr-only">Buscar en la categoría</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted lg:left-4 lg:size-5" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => alCambiarBusqueda(e.target.value.toUpperCase())}
            placeholder={`Buscar en ${seccion.nombre.toLowerCase()}`}
            autoComplete="off"
            className="h-12 w-full rounded-xl border border-line bg-surface pl-9 pr-10 text-base outline-none lg:h-14 lg:pl-12 lg:text-lg transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10 short:h-10 [&::-webkit-search-cancel-button]:hidden"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => alCambiarBusqueda('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-muted transition hover:bg-primary/10 hover:text-fg active:scale-90"
            >
              <X className="size-4" />
            </button>
          )}
        </label>
        {seccion.subsecciones.length > 0 && (
          <div className="flex h-14 items-center gap-2 short:h-12 lg:h-16">
            <div
              ref={listaSubsecciones}
              role="tablist"
              aria-label="Subsecciones"
              className="-ml-1 flex min-w-0 flex-1 snap-x gap-1.5 overflow-x-auto py-1.5 pl-1 pr-9 [mask-image:linear-gradient(to_right,black_calc(100%-36px),transparent)] [scrollbar-width:none] lg:gap-2 [&::-webkit-scrollbar]:hidden"
            >
              {[{ codigo: 0, nombre: 'Todas' }, ...seccion.subsecciones].map((sub) => (
                <button
                  key={sub.codigo}
                  type="button"
                  role="tab"
                  aria-selected={sub.codigo === subseccion}
                  onClick={() => alCambiarSubseccion(sub.codigo)}
                  className={`inline-flex h-9 max-w-[14rem] shrink-0 snap-start cursor-pointer items-center rounded-lg px-3.5 text-xs font-bold transition active:scale-95 lg:h-11 lg:px-5 lg:text-sm ${
                    sub.codigo === subseccion
                      ? 'bg-primary text-white shadow-md shadow-primary/30'
                      : 'border border-line bg-surface text-muted hover:border-primary/50 hover:text-fg'
                  }`}
                >
                  <span className="truncate">{sub.nombre}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setVerSubsecciones(true)}
              className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 text-xs font-bold text-primary transition hover:bg-primary/15 active:scale-95 lg:h-11 lg:px-4 lg:text-sm"
            >
              <span className="hidden sm:inline">Ver detalles</span>
              <span className="sm:hidden">Ver</span>
            </button>
          </div>
        )}
      </div>

      <div className="items-start [--fila:7.5rem] [--hdr:73px] [--pie:calc(env(safe-area-inset-bottom)+7.5rem)] md:grid md:h-[calc(var(--alto-app,100dvh)-var(--hdr)-var(--fila)-var(--pie))] short:[--hdr:57px] short:[--pie:calc(env(safe-area-inset-bottom)+5rem)] short:[--fila:6.25rem] lg:[--fila:8.5rem] escritorio:[--pie:2rem] short:escritorio:[--pie:1rem] md:grid-cols-[minmax(0,1fr)_320px] max-lg:short:md:grid-cols-[minmax(0,1fr)]! md:grid-rows-[minmax(0,1fr)] md:gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-5 min-[1400px]:grid-cols-[minmax(0,1fr)_420px]">
        <ul className="grid min-w-0 grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] content-start md:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] max-lg:short:pb-20 lg:grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] md:h-full md:overflow-y-auto md:overscroll-contain md:pr-2 gap-2.5 lg:gap-3 short:gap-2">
          {platos.isPending && (
            <li role="status" className="col-span-full py-10 text-center text-sm text-muted">
              Cargando productos...
            </li>
          )}
          {platos.isError && (
            <li role="alert" className="col-span-full py-10 text-center text-sm text-muted">
              No se pudieron cargar los productos.{' '}
              <button
                type="button"
                onClick={() => void platos.refetch()}
                className="cursor-pointer font-bold text-primary underline"
              >
                Reintentar
              </button>
            </li>
          )}
          {platos.isSuccess && visibles.length === 0 && (
            <li className="col-span-full py-10 text-center text-sm text-muted">
              No hay productos que coincidan.
            </li>
          )}
          {visibles.map((plato, i) => {
            const c = elegidos[plato.id]?.cantidad ?? 0
            return (
              <li
                key={plato.id}
                style={{ animationDelay: `${Math.min(i, 8) * 15}ms` }}
                className={`flex animate-[chip-in_0.16s_ease-out_both] flex-col justify-between gap-2.5 rounded-2xl border p-3 transition duration-200 short:p-2 lg:p-4 ${
                  c > 0
                    ? 'border-primary/60 bg-primary/[0.07] shadow-[0_8px_20px_rgba(43,83,184,.12)]'
                    : 'border-line bg-surface'
                }`}
              >
                <h3 className="line-clamp-3 text-sm font-bold leading-tight [overflow-wrap:anywhere] lg:text-base">
                  {plato.nombre}
                </h3>
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
                  <p className="shrink-0 text-sm font-extrabold tabular-nums text-primary lg:text-lg">
                    {formatoMoneda(plato.precio)}
                  </p>
                  {c === 0 ? (
                    <button
                      type="button"
                      aria-label={`Agregar ${plato.nombre}`}
                      onClick={() => alCambiarCantidad(plato, 1)}
                      className={`${boton} ml-auto bg-primary text-white shadow-md shadow-primary/30 hover:brightness-110`}
                    >
                      <Plus className="size-5" />
                    </button>
                  ) : (
                    <div className="ml-auto flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        aria-label={`Quitar ${plato.nombre}`}
                        onClick={() => alCambiarCantidad(plato, -1)}
                        className={`${boton} border border-line bg-surface hover:border-primary/60`}
                      >
                        <Minus className="size-4" />
                      </button>
                      <strong className="w-5 text-center text-base font-extrabold tabular-nums lg:w-7 lg:text-lg">
                        {c}
                      </strong>
                      <button
                        type="button"
                        aria-label={`Agregar ${plato.nombre}`}
                        onClick={() => alCambiarCantidad(plato, 1)}
                        className={`${boton} bg-primary text-white hover:brightness-110`}
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
        {lateral}
      </div>

      <ModalSubsecciones
        abierto={verSubsecciones}
        seccion={seccion}
        subseccion={subseccion}
        alElegir={alCambiarSubseccion}
        alCerrar={() => setVerSubsecciones(false)}
      />
    </section>
  )
}
