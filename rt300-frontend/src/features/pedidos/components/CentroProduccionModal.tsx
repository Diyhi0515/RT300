import { useState } from 'react'
import { Check, House } from 'lucide-react'
import { Modal } from '@/shared/ui/Modal'
import { useCentrosPlato } from '../hooks'
import type { CentroElegido } from '../types'

interface CentroProduccionModalProps {
  cart: string
  producto: string
  actual?: CentroElegido
  alGuardar: (centro: CentroElegido | undefined) => void
  alCerrar: () => void
}

const opcion = (activa: boolean) =>
  `flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-2 text-left text-sm font-bold uppercase leading-tight transition active:scale-[0.98] [overflow-wrap:anywhere] ${
    activa
      ? 'bg-gradient-to-br from-club-pc to-club-tertiary text-white shadow-lg shadow-club-pc/30'
      : 'border border-line bg-surface hover:border-primary/50 hover:shadow-md'
  }`

export function CentroProduccionModal({
  cart,
  producto,
  actual,
  alGuardar,
  alCerrar,
}: CentroProduccionModalProps) {
  const centros = useCentrosPlato(cart)
  const [elegido, setElegido] = useState<number | null>(actual?.codigo ?? null)

  const guardar = () => {
    const centro = (centros.data ?? []).find((c) => c.codigo === elegido)
    alGuardar(centro ? { codigo: centro.codigo, nombre: centro.nombre } : undefined)
  }

  return (
    <Modal
      open
      onClose={alCerrar}
      title={`Centro de producción de ${producto}`}
      className="max-w-md!"
    >
      <div className="flex max-h-[85dvh] flex-col short:max-h-[92dvh]">
        <div className="flex shrink-0 items-center gap-3 border-b border-line bg-gradient-to-r from-club-pc/15 via-club-pc/5 to-transparent px-5 py-4 pr-14">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-club-pc to-club-tertiary text-white shadow-lg shadow-club-pc/30">
            <House className="size-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold leading-tight">Centro de producción</h3>
            <p className="line-clamp-2 text-xs font-semibold uppercase text-muted [overflow-wrap:anywhere]">
              {producto}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
          <p className="text-xs text-muted">
            Elige a dónde se envía este producto para prepararlo.
          </p>
          <button
            type="button"
            onClick={() => setElegido(null)}
            className={opcion(elegido === null)}
          >
            <span className="min-w-0 flex-1">Centro del local (por defecto)</span>
            {elegido === null && <Check className="size-4 shrink-0" aria-hidden />}
          </button>
          {centros.isPending && (
            <p role="status" className="py-6 text-center text-sm text-muted">
              Cargando centros...
            </p>
          )}
          {centros.isError && (
            <p role="alert" className="py-6 text-center text-sm text-muted">
              No se pudieron cargar los centros.{' '}
              <button
                type="button"
                onClick={() => void centros.refetch()}
                className="cursor-pointer font-bold text-primary underline"
              >
                Reintentar
              </button>
            </p>
          )}
          {centros.isSuccess && centros.data.length === 0 && (
            <p className="py-4 text-center text-sm text-muted">
              Este producto no tiene otros centros disponibles.
            </p>
          )}
          {(centros.data ?? []).map((c) => (
            <button
              key={c.codigo}
              type="button"
              onClick={() => setElegido(c.codigo)}
              className={opcion(elegido === c.codigo)}
            >
              <span className="min-w-0 flex-1">{c.nombre}</span>
              {elegido === c.codigo && <Check className="size-4 shrink-0" aria-hidden />}
            </button>
          ))}
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-line bg-surface p-4 short:p-3">
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
    </Modal>
  )
}
