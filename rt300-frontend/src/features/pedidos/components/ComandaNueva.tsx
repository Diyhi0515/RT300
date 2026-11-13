import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChefHat, ChevronUp, Minus, Plus, Search, Send, Utensils, X } from 'lucide-react'
import { formatoMoneda } from '@/features/salon/formato'
import { vibrar } from '@/lib/vibrar'
import { notificar } from '@/shared/avisos/almacen'
import { cantidadItems, totalItems } from '../calculos'
import { useEnviarComanda, useMesaDetalle, usePlatos, useSecciones } from '../hooks'
import { usePedidos } from '../store'
import type { ItemComanda, Plato } from '../types'

const boton =
  'grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl transition active:scale-90 short:size-9'

const pestana = (activa: boolean) =>
  `inline-flex h-10 max-w-[16rem] shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition active:scale-95 short:h-9 ${
    activa
      ? 'bg-primary text-white shadow-md shadow-primary/30'
      : 'border border-line bg-surface text-muted hover:border-primary/50 hover:text-fg'
  }`

interface ContenidoProps {
  codigo: string
  numero: number
  alCerrar: () => void
}

function Contenido({ codigo, numero, alCerrar }: ContenidoProps) {
  const { mesa } = useMesaDetalle(codigo)
  const secciones = useSecciones()
  const envio = useEnviarComanda()
  const [seccionElegida, setSeccionElegida] = useState<number | null>(null)
  const [subseccion, setSubseccion] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [elegidos, setElegidos] = useState<Record<string, ItemComanda>>({})
  const [verResumen, setVerResumen] = useState(false)

  const listaSecciones = secciones.data ?? []
  const seccion = seccionElegida ?? listaSecciones[0]?.codigo ?? null
  const seccionActual = listaSecciones.find((s) => s.codigo === seccion)
  const platos = usePlatos(seccion, subseccion)

  useEffect(() => {
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') alCerrar()
    }
    window.addEventListener('keydown', alTeclear)
    return () => {
      document.body.style.overflow = previo
      window.removeEventListener('keydown', alTeclear)
    }
  }, [alCerrar])

  const items = Object.values(elegidos)
  const texto = busqueda.trim().toLowerCase()
  const visibles = (platos.data ?? []).filter(
    (p) => !texto || p.nombre.toLowerCase().includes(texto) || p.id.toLowerCase().includes(texto),
  )

  const cambiar = (plato: Plato, delta: number) => {
    vibrar('toque')
    setElegidos((actual) => {
      const nueva = Math.max(0, (actual[plato.id]?.cantidad ?? 0) + delta)
      const copia = { ...actual }
      if (nueva === 0) delete copia[plato.id]
      else copia[plato.id] = { plato, cantidad: nueva }
      return copia
    })
  }

  const total = totalItems(items)
  const cantidad = cantidadItems(items)

  const enviar = async () => {
    if (!items.length || !mesa) return
    try {
      await envio.mutateAsync({
        folio: mesa.folio,
        cuenta: numero,
        glos: '',
        items: items.map((i) => ({ cart: i.plato.id, cant: i.cantidad })),
      })
    } catch {
      return
    }
    vibrar('exito')
    notificar.exito(
      `${cantidad} ${cantidad === 1 ? 'producto' : 'productos'} por ${formatoMoneda(total)}.`,
      'Comanda enviada a cocina',
    )
    alCerrar()
  }

  const resumen = (
    <>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center short:py-4">
          <ChefHat className="size-8 text-muted" />
          <p className="text-sm text-muted">Agrega productos para armar la comanda.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {items.map(({ plato, cantidad: c }) => (
            <li key={plato.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-extrabold tabular-nums text-primary">
                {c}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{plato.nombre}</span>
              <span className="text-sm font-bold tabular-nums">
                {formatoMoneda(c * plato.precio)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  )

  const botonEnviar = (clases: string, etiqueta: string) => (
    <button
      type="button"
      disabled={!items.length || envio.isPending || !mesa}
      onClick={() => void enviar()}
      className={clases}
    >
      <Send className="size-[18px]" />
      {envio.isPending ? 'Enviando...' : etiqueta}
    </button>
  )

  return (
    <div className="fixed inset-0 z-[70] flex animate-[fade_0.2s_ease-out] items-stretch justify-center bg-black/60 backdrop-blur-sm md:items-center md:p-6 short:md:p-3">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Nueva comanda"
        className="flex h-full w-full animate-[pop_0.25s_cubic-bezier(0.2,1.1,0.4,1)] flex-col overflow-hidden bg-bg text-fg md:h-[min(780px,100%)] md:max-w-5xl md:rounded-3xl md:border md:border-line md:shadow-[0_30px_80px_rgba(0,0,0,.45)]"
      >
        <header className="relative flex shrink-0 items-center gap-3 overflow-hidden bg-header px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-white md:pt-3 short:py-2">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(43,83,184,0.3),transparent_50%)]" />
          <span className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15 short:size-9">
            <ChefHat className="size-5" />
          </span>
          <div className="relative min-w-0 flex-1">
            <h2 className="truncate text-lg font-extrabold leading-tight short:text-base">
              Nueva comanda
            </h2>
            <p className="truncate text-xs text-white/70">
              Mesa {codigo} · Cuenta {numero}
            </p>
          </div>
          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar comanda"
            className={`${boton} relative bg-white/10 text-white hover:bg-white/20`}
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-h-0 min-w-0 flex-col">
            <div className="shrink-0 space-y-2.5 px-4 pb-2 pt-3 short:space-y-1.5 short:pt-2">
              <label className="relative block">
                <span className="sr-only">Buscar en la sección</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar en esta sección"
                  className="h-11 w-full rounded-xl border border-line bg-surface pl-9 pr-3 text-base outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10 short:h-10 [&::-webkit-search-cancel-button]:hidden"
                />
              </label>
              <div
                role="tablist"
                aria-label="Secciones del menú"
                className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {secciones.isPending && (
                  <span role="status" className="py-2 text-sm text-muted">
                    Cargando menú...
                  </span>
                )}
                {listaSecciones.map((s) => (
                  <button
                    key={s.codigo}
                    type="button"
                    role="tab"
                    aria-selected={s.codigo === seccion}
                    onClick={() => {
                      setBusqueda('')
                      setSubseccion(0)
                      setSeccionElegida(s.codigo)
                    }}
                    className={pestana(s.codigo === seccion)}
                  >
                    <Utensils className="size-4 shrink-0" />
                    <span className="truncate">{s.nombre}</span>
                  </button>
                ))}
              </div>
              {seccionActual && seccionActual.subsecciones.length > 0 && (
                <div
                  role="tablist"
                  aria-label="Subsecciones"
                  className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {[{ codigo: 0, nombre: 'Todas' }, ...seccionActual.subsecciones].map((sub) => (
                    <button
                      key={sub.codigo}
                      type="button"
                      role="tab"
                      aria-selected={sub.codigo === subseccion}
                      onClick={() => {
                        setBusqueda('')
                        setSubseccion(sub.codigo)
                      }}
                      className={`inline-flex h-8 max-w-[14rem] shrink-0 cursor-pointer items-center rounded-lg px-3 text-xs font-bold transition active:scale-95 ${
                        sub.codigo === subseccion
                          ? 'bg-primary/15 text-primary ring-1 ring-primary/50'
                          : 'text-muted hover:bg-primary/5 hover:text-fg'
                      }`}
                    >
                      <span className="truncate">{sub.nombre}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <ul className="grid min-h-0 flex-1 grid-cols-1 content-start gap-2.5 overflow-y-auto overscroll-contain px-4 pb-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 short:gap-2">
              {platos.isPending && seccion !== null && (
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
                    style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}
                    className={`flex animate-[chip-in_0.3s_ease-out_both] items-center gap-3 rounded-2xl border p-3 transition duration-200 short:p-2 ${
                      c > 0
                        ? 'border-primary/60 bg-primary/[0.07] shadow-[0_8px_20px_rgba(43,83,184,.12)]'
                        : 'border-line bg-surface'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold">{plato.nombre}</h3>
                      <p className="line-clamp-1 text-xs text-muted">Código {plato.id}</p>
                      <p className="mt-1 text-sm font-extrabold tabular-nums text-primary">
                        {formatoMoneda(plato.precio)}
                      </p>
                    </div>
                    {c === 0 ? (
                      <button
                        type="button"
                        aria-label={`Agregar ${plato.nombre}`}
                        onClick={() => cambiar(plato, 1)}
                        className={`${boton} bg-primary text-white shadow-md shadow-primary/30 hover:brightness-110`}
                      >
                        <Plus className="size-5" />
                      </button>
                    ) : (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          aria-label={`Quitar ${plato.nombre}`}
                          onClick={() => cambiar(plato, -1)}
                          className={`${boton} border border-line bg-surface hover:border-primary/60`}
                        >
                          <Minus className="size-4" />
                        </button>
                        <strong className="w-6 text-center text-base font-extrabold tabular-nums">
                          {c}
                        </strong>
                        <button
                          type="button"
                          aria-label={`Agregar ${plato.nombre}`}
                          onClick={() => cambiar(plato, 1)}
                          className={`${boton} bg-primary text-white hover:brightness-110`}
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          <aside className="hidden min-h-0 flex-col border-l border-line bg-surface md:flex">
            <h3 className="shrink-0 border-b border-line px-4 py-3 text-sm font-bold">
              Resumen de la comanda
            </h3>
            <div className="min-h-0 flex-1 overflow-y-auto">{resumen}</div>
            <div className="shrink-0 space-y-3 border-t border-line p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted">Total</span>
                <strong className="text-2xl font-extrabold tabular-nums">
                  {formatoMoneda(total)}
                </strong>
              </div>
              {botonEnviar(
                'flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-club-pc to-club-tertiary font-bold text-white shadow-[0_10px_24px_rgba(43,83,184,.35)] transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none short:h-10',
                'Enviar a cocina',
              )}
            </div>
          </aside>
        </div>

        <div className="relative shrink-0 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
          {verResumen && (
            <div className="max-h-[40dvh] animate-[subir_0.2s_ease-out] overflow-y-auto border-b border-line">
              {resumen}
            </div>
          )}
          <div className="flex items-center gap-3 p-3 short:p-2">
            <button
              type="button"
              onClick={() => setVerResumen((v) => !v)}
              aria-expanded={verResumen}
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl px-1 text-left"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary short:size-9">
                <ChevronUp
                  className={`size-5 transition-transform duration-200 ${verResumen ? 'rotate-180' : ''}`}
                />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] text-muted">
                  {cantidad} {cantidad === 1 ? 'producto' : 'productos'}
                </span>
                <strong className="block text-lg font-extrabold leading-tight tabular-nums">
                  {formatoMoneda(total)}
                </strong>
              </span>
            </button>
            {botonEnviar(
              'flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-club-pc to-club-tertiary px-5 font-bold text-white shadow-[0_10px_24px_rgba(43,83,184,.35)] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none short:h-10',
              'Enviar',
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export function ComandaNueva() {
  const codigo = usePedidos((s) => s.seleccionada)
  const numero = usePedidos((s) => s.comandaEn)
  const abrirComanda = usePedidos((s) => s.abrirComanda)

  if (!codigo || numero === null) return null

  return createPortal(
    <Contenido
      key={`${codigo}-${numero}`}
      codigo={codigo}
      numero={numero}
      alCerrar={() => abrirComanda(null)}
    />,
    document.body,
  )
}
