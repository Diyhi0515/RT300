import { useState } from 'react'
import { CirclePlus, Minus, Plus } from 'lucide-react'
import { formatoMoneda } from '@/features/salon/formato'
import { Modal } from '@/shared/ui/Modal'
import { useExtrasPlato } from '../hooks'
import { MAXIMO_CANTIDAD_PRODUCTO, MAXIMO_EXTRAS_PRODUCTO } from '../limites'
import type { ExtraElegido } from '../types'

interface ExtrasProductoModalProps {
  producto: string
  seccion?: number
  subseccion?: number
  actual?: ExtraElegido[]
  alGuardar: (extras: ExtraElegido[]) => void
  alCerrar: () => void
}

const paso =
  'grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-40'

export function ExtrasProductoModal({
  producto,
  seccion,
  subseccion,
  actual,
  alGuardar,
  alCerrar,
}: ExtrasProductoModalProps) {
  const extras = useExtrasPlato(seccion, subseccion)
  const [cantidades, setCantidades] = useState<Record<string, number>>(() =>
    Object.fromEntries((actual ?? []).map((e) => [e.codigo, e.cantidad])),
  )

  const disponibles = extras.data ?? []
  const elegidos = disponibles.filter((e) => (cantidades[e.codigo] ?? 0) > 0)
  const total = elegidos.reduce((suma, e) => suma + e.precio * (cantidades[e.codigo] ?? 0), 0)
  const sinContexto = !seccion || !subseccion

  const cambiar = (codigo: string, delta: number) =>
    setCantidades((previas) => {
      const nueva = Math.min(MAXIMO_CANTIDAD_PRODUCTO, Math.max(0, (previas[codigo] ?? 0) + delta))
      const copia = { ...previas }
      if (nueva === 0) delete copia[codigo]
      else if (Object.keys(copia).length < MAXIMO_EXTRAS_PRODUCTO || codigo in copia)
        copia[codigo] = nueva
      return copia
    })

  const guardar = () =>
    alGuardar(
      elegidos.map((e) => ({
        codigo: e.codigo,
        nombre: e.nombre,
        precio: e.precio,
        cantidad: cantidades[e.codigo] ?? 0,
      })),
    )

  return (
    <Modal open onClose={alCerrar} title={`Extras de ${producto}`} className="max-w-lg!">
      <div className="flex max-h-[85dvh] flex-col short:max-h-[92dvh]">
        <div className="flex shrink-0 items-center gap-3 border-b border-line bg-gradient-to-r from-club-pc/15 via-club-pc/5 to-transparent px-5 py-4 pr-14">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-club-pc to-club-tertiary text-white shadow-lg shadow-club-pc/30">
            <CirclePlus className="size-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold leading-tight">Extras</h3>
            <p className="line-clamp-2 text-xs font-semibold uppercase text-muted [overflow-wrap:anywhere]">
              {producto}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
          {sinContexto && (
            <p className="py-6 text-center text-sm text-muted">
              Este producto no tiene extras disponibles.
            </p>
          )}
          {!sinContexto && extras.isPending && (
            <p role="status" className="py-6 text-center text-sm text-muted">
              Cargando extras...
            </p>
          )}
          {!sinContexto && extras.isError && (
            <p role="alert" className="py-6 text-center text-sm text-muted">
              No se pudieron cargar los extras.{' '}
              <button
                type="button"
                onClick={() => void extras.refetch()}
                className="cursor-pointer font-bold text-primary underline"
              >
                Reintentar
              </button>
            </p>
          )}
          {extras.isSuccess && disponibles.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">
              Este producto no tiene extras disponibles.
            </p>
          )}
          {disponibles.map((e) => {
            const cantidad = cantidades[e.codigo] ?? 0
            return (
              <div
                key={e.codigo}
                className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                  cantidad > 0 ? 'border-primary/60 bg-primary/[0.07]' : 'border-line bg-surface'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold uppercase leading-tight [overflow-wrap:anywhere]">
                    {e.nombre}
                  </p>
                  <p className="mt-0.5 text-sm font-extrabold tabular-nums text-primary">
                    {formatoMoneda(e.precio)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`Quitar un ${e.nombre}`}
                    disabled={cantidad === 0}
                    onClick={() => cambiar(e.codigo, -1)}
                    className={`${paso} border border-line bg-surface hover:border-primary/60`}
                  >
                    <Minus className="size-4" aria-hidden />
                  </button>
                  <strong className="w-6 text-center text-base font-extrabold tabular-nums">
                    {cantidad}
                  </strong>
                  <button
                    type="button"
                    aria-label={`Agregar un ${e.nombre}`}
                    disabled={cantidad >= MAXIMO_CANTIDAD_PRODUCTO}
                    onClick={() => cambiar(e.codigo, 1)}
                    className={`${paso} bg-primary text-white hover:brightness-110`}
                  >
                    <Plus className="size-4" aria-hidden />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="shrink-0 space-y-3 border-t border-line bg-surface p-4 short:space-y-2 short:p-3">
          <div className="flex items-end justify-between">
            <span className="text-sm font-semibold text-muted">Total de extras</span>
            <strong className="text-xl font-extrabold tabular-nums">{formatoMoneda(total)}</strong>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={alCerrar}
              className="h-12 cursor-pointer rounded-xl border border-line font-semibold transition hover:bg-primary/5 active:scale-[0.98] short:h-10"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              className="h-12 cursor-pointer rounded-xl bg-primary font-bold text-white transition hover:brightness-110 active:scale-[0.98] short:h-10"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
