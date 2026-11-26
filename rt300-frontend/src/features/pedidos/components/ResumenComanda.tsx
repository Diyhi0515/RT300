import { ChefHat, CirclePlus, House, Minus, NotebookPen, Plus, Trash2 } from 'lucide-react'
import { formatoMoneda } from '@/features/salon/formato'
import { totalExtras } from '../calculos'
import type { ItemComanda, Plato } from '../types'

export type TipoEdicion = 'nota' | 'extras' | 'centro'

interface ResumenComandaProps {
  items: ItemComanda[]
  total: number
  enviando: boolean
  deshabilitado: boolean
  alEnviar: () => void
  alVistaPrevia: () => void
  alCambiarCantidad: (plato: Plato, delta: number) => void
  alEliminar: (id: string) => void
  alVaciar: () => void
  alEditar: (id: string, tipo: TipoEdicion) => void
}

const herramienta = (activa: boolean) =>
  `inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 text-[11px] font-bold transition active:scale-95 lg:h-9 lg:text-xs ${
    activa
      ? 'border-primary/50 bg-primary/10 text-primary'
      : 'border-line bg-surface text-muted hover:border-primary/50 hover:text-fg'
  }`

const paso =
  'grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg transition active:scale-90 lg:size-9'

export function ResumenComanda({
  items,
  total,
  enviando,
  deshabilitado,
  alEnviar,
  alVistaPrevia,
  alCambiarCantidad,
  alEliminar,
  alVaciar,
  alEditar,
}: ResumenComandaProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className={`max-h-[27.5rem] flex min-h-0 flex-1 flex-col overflow-y-auto md:max-h-none short:max-h-none [mask-image:linear-gradient(to_bottom,black_calc(100%-18px),transparent)]`}
      >
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-10 text-center short:py-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary short:size-10">
              <ChefHat className="size-7 short:size-5" aria-hidden />
            </span>
            <p className="text-sm font-semibold">Aún no hay productos</p>
            <p className="text-xs text-muted">Agrega productos para armar la comanda.</p>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 items-center justify-end px-3 pt-2.5 short:pt-1.5">
              <button
                type="button"
                onClick={alVaciar}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-danger transition hover:bg-danger/10 active:scale-95"
              >
                <Trash2 className="size-3.5" aria-hidden />
                Vaciar comanda
              </button>
            </div>
            <ul className="space-y-2 p-3 pb-5 pt-1 short:space-y-1.5 short:p-2 short:pb-4">
              {items.map((item) => {
                const { plato, cantidad, categoria, subcategoria, nota, centro, extras } = item
                return (
                  <li
                    key={plato.id}
                    className="rounded-xl border border-line bg-bg/60 p-2.5 short:p-2"
                  >
                    <p className="line-clamp-2 text-sm font-bold uppercase leading-tight [overflow-wrap:anywhere] lg:text-base short:lg:text-sm">
                      {plato.nombre}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Quitar uno de ${plato.nombre}`}
                          onClick={() => alCambiarCantidad(plato, -1)}
                          className={`${paso} border border-line bg-surface hover:border-primary/60`}
                        >
                          <Minus className="size-3.5" aria-hidden />
                        </button>
                        <strong className="w-7 text-center text-sm font-extrabold tabular-nums">
                          {cantidad}
                        </strong>
                        <button
                          type="button"
                          aria-label={`Sumar uno de ${plato.nombre}`}
                          onClick={() => alCambiarCantidad(plato, 1)}
                          className={`${paso} bg-primary text-white hover:brightness-110`}
                        >
                          <Plus className="size-3.5" aria-hidden />
                        </button>
                        <span className="ml-1.5 text-xs text-muted tabular-nums lg:text-sm">
                          × {formatoMoneda(plato.precio)}
                        </span>
                      </div>
                      <span className="text-sm font-extrabold tabular-nums text-primary lg:text-base">
                        {formatoMoneda(cantidad * plato.precio + totalExtras(item))}
                      </span>
                    </div>
                    {(categoria || subcategoria) && (
                      <p className="mt-1.5 line-clamp-1 short:hidden text-[10px] font-semibold uppercase tracking-wide text-muted lg:text-[11px]">
                        {[categoria, subcategoria].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {(nota || centro || (extras && extras.length > 0)) && (
                      <dl className="mt-1.5 space-y-0.5 text-[11px] leading-snug lg:text-xs">
                        {nota && (
                          <div className="flex gap-1.5">
                            <dt className="shrink-0 font-bold text-muted">Nota:</dt>
                            <dd className="min-w-0 font-semibold uppercase [overflow-wrap:anywhere]">
                              {nota}
                            </dd>
                          </div>
                        )}
                        {extras && extras.length > 0 && (
                          <div className="flex gap-1.5">
                            <dt className="shrink-0 font-bold text-muted">Extras:</dt>
                            <dd className="min-w-0 font-semibold uppercase [overflow-wrap:anywhere]">
                              {extras.map((e) => `${e.cantidad} ${e.nombre}`).join(', ')}
                            </dd>
                          </div>
                        )}
                        {centro && (
                          <div className="flex gap-1.5">
                            <dt className="shrink-0 font-bold text-muted">Centro:</dt>
                            <dd className="min-w-0 font-semibold uppercase [overflow-wrap:anywhere]">
                              {centro.nombre}
                            </dd>
                          </div>
                        )}
                      </dl>
                    )}
                    <div className="mt-2 flex items-start gap-1.5 short:mt-1.5">
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          aria-label={`Nota de ${plato.nombre}`}
                          onClick={() => alEditar(plato.id, 'nota')}
                          className={herramienta(!!nota)}
                        >
                          <NotebookPen className="size-3.5" aria-hidden />
                          Nota
                        </button>
                        <button
                          type="button"
                          aria-label={`Extras de ${plato.nombre}`}
                          onClick={() => alEditar(plato.id, 'extras')}
                          className={herramienta(!!extras?.length)}
                        >
                          <CirclePlus className="size-3.5" aria-hidden />
                          Extras
                        </button>
                        <button
                          type="button"
                          aria-label={`Centro de producción de ${plato.nombre}`}
                          onClick={() => alEditar(plato.id, 'centro')}
                          className={herramienta(!!centro)}
                        >
                          <House className="size-3.5" aria-hidden />
                          Centro
                        </button>
                      </div>
                      <button
                        type="button"
                        aria-label={`Eliminar ${plato.nombre}`}
                        onClick={() => alEliminar(plato.id)}
                        className="grid size-8 shrink-0cursor-pointer place-items-center rounded-lg border border-danger/40 text-danger transition hover:bg-danger/10 active:scale-90 lg:size-9"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
      <div className="sticky bottom-0 z-10 shrink-0 space-y-3 border-t border-line bg-surface p-4 short:space-y-2 short:p-3">
        <div className="flex items-end justify-between">
          <span className="text-sm font-semibold text-muted">Total</span>
          <strong className="text-2xl font-extrabold tabular-nums short:text-xl lg:text-3xl">
            {formatoMoneda(total)}
          </strong>
        </div>
        <button
          type="button"
          disabled={deshabilitado || enviando}
          onClick={alEnviar}
          className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl lg:h-14 lg:text-lg bg-gradient-to-r from-club-pc to-club-tertiary font-bold text-white shadow-[0_10px_24px_rgba(43,83,184,.35)] transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none short:h-10"
        >
          {enviando ? 'Registrando...' : 'Registrar comanda'}
        </button>
        <button
          type="button"
          disabled={deshabilitado}
          onClick={alVistaPrevia}
          className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-surface text-sm font-bold transition hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 short:h-9 lg:h-12"
        >
          Vista previa del pedido
        </button>
      </div>
    </div>
  )
}
