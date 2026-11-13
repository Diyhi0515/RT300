import { useState } from 'react'
import { ChevronDown, Search, UtensilsCrossed } from 'lucide-react'
import { usePlatos, useSecciones } from '@/features/pedidos/hooks'
import { formatoMoneda } from '@/features/salon/formato'
import { EncabezadoSeccion } from '../components/EncabezadoSeccion'

const campo =
  'h-11 w-full rounded-xl border border-line bg-surface text-base outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10'

const sinBarra = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

export function MenuAdminPage() {
  const secciones = useSecciones()
  const [elegida, setElegida] = useState<number | null>(null)
  const [subseccion, setSubseccion] = useState(0)
  const [busqueda, setBusqueda] = useState('')

  const lista = secciones.data ?? []
  const codigo = elegida ?? lista[0]?.codigo ?? null
  const actual = lista.find((s) => s.codigo === codigo)
  const platos = usePlatos(codigo, subseccion)

  const elegirSeccion = (nuevo: number) => {
    setBusqueda('')
    setSubseccion(0)
    setElegida(nuevo)
  }

  const texto = busqueda.trim().toLowerCase()
  const visibles = (platos.data ?? []).filter(
    (p) => !texto || p.nombre.toLowerCase().includes(texto) || p.id.toLowerCase().includes(texto),
  )

  return (
    <div>
      <EncabezadoSeccion
        titulo="Menú"
        descripcion="Consulta de secciones, productos y precios. Solo lectura."
        icono={UtensilsCrossed}
      />

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
        <div className="lg:sticky lg:top-[88px]">
          <label className="relative block lg:hidden">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
              Sección
            </span>
            <select
              value={codigo ?? ''}
              onChange={(e) => elegirSeccion(Number(e.target.value))}
              className={`${campo} appearance-none px-3 pr-10 font-semibold`}
            >
              {lista.map((s) => (
                <option key={s.codigo} value={s.codigo}>
                  {s.nombre}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute bottom-3.5 right-3 size-4 text-muted" />
          </label>

          <nav
            aria-label="Secciones del menú"
            className="hidden max-h-[calc(100dvh-140px)] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-surface p-2 lg:block"
          >
            <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              Secciones
            </p>
            {secciones.isPending && (
              <p role="status" className="px-3 py-2 text-sm text-muted">
                Cargando menú...
              </p>
            )}
            {lista.map((s) => (
              <button
                key={s.codigo}
                type="button"
                aria-current={s.codigo === codigo ? 'true' : undefined}
                onClick={() => elegirSeccion(s.codigo)}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                  s.codigo === codigo
                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                    : 'text-muted hover:bg-primary/10 hover:text-fg'
                }`}
              >
                <span className="min-w-0 break-words">{s.nombre}</span>
                {s.subsecciones.length > 0 && (
                  <span
                    className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] tabular-nums ${
                      s.codigo === codigo ? 'bg-white/20' : 'bg-bg'
                    }`}
                  >
                    {s.subsecciones.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="min-w-0 space-y-3">
          <label className="relative block">
            <span className="sr-only">Buscar en la sección</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={`Buscar en ${actual?.nombre.toLowerCase() ?? 'la sección'}`}
              className={`${campo} pl-9 pr-3 [&::-webkit-search-cancel-button]:hidden`}
            />
          </label>

          {actual && actual.subsecciones.length > 0 && (
            <div
              role="group"
              aria-label="Subsecciones"
              className={`flex gap-1.5 overflow-x-auto ${sinBarra} lg:flex-wrap`}
            >
              {[{ codigo: 0, nombre: 'Todas' }, ...actual.subsecciones].map((sub) => (
                <button
                  key={sub.codigo}
                  type="button"
                  aria-pressed={sub.codigo === subseccion}
                  onClick={() => {
                    setBusqueda('')
                    setSubseccion(sub.codigo)
                  }}
                  className={`inline-flex h-9 shrink-0 cursor-pointer items-center rounded-full border px-4 text-xs font-bold transition active:scale-95 ${
                    sub.codigo === subseccion
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-line bg-surface text-muted hover:border-primary/50 hover:text-fg'
                  }`}
                >
                  {sub.nombre}
                </button>
              ))}
            </div>
          )}

          <section className="overflow-hidden rounded-2xl border border-line bg-surface">
            <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <h2 className="min-w-0 truncate text-sm font-bold">{actual?.nombre ?? 'Productos'}</h2>
              {platos.isSuccess && (
                <span className="shrink-0 text-xs text-muted">
                  {visibles.length} {visibles.length === 1 ? 'producto' : 'productos'}
                </span>
              )}
            </header>

            {platos.isPending && codigo !== null && (
              <p role="status" className="py-10 text-center text-sm text-muted">
                Cargando productos...
              </p>
            )}
            {platos.isError && (
              <p role="alert" className="py-10 text-center text-sm text-muted">
                No se pudieron cargar los productos.{' '}
                <button
                  type="button"
                  onClick={() => void platos.refetch()}
                  className="cursor-pointer font-bold text-primary underline"
                >
                  Reintentar
                </button>
              </p>
            )}
            {platos.isSuccess && visibles.length === 0 && (
              <p className="py-10 text-center text-sm text-muted">No hay productos que coincidan.</p>
            )}
            {visibles.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <caption className="sr-only">Productos de la sección</caption>
                  <thead className="border-b border-line bg-bg text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th scope="col" className="px-4 py-3">Código</th>
                      <th scope="col" className="px-4 py-3">Producto</th>
                      <th scope="col" className="px-4 py-3 text-right">Precio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {visibles.map((p) => (
                      <tr key={p.id} className="transition hover:bg-primary/5">
                        <td className="px-4 py-3 tabular-nums text-muted">{p.id}</td>
                        <td className="px-4 py-3 font-medium">{p.nombre}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {formatoMoneda(p.precio)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
