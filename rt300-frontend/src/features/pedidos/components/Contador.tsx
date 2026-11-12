import { Minus, Plus } from 'lucide-react'
import { vibrar } from '@/lib/vibrar'

interface ContadorProps {
  etiqueta: string
  detalle?: string
  valor: number
  minimo: number
  maximo: number
  alCambiar: (valor: number) => void
}

const boton =
  'grid size-11 cursor-pointer place-items-center rounded-xl border border-line bg-surface transition hover:border-primary/60 hover:bg-primary/10 active:scale-90 disabled:cursor-not-allowed disabled:opacity-35 short:size-9'

export function Contador({ etiqueta, detalle, valor, minimo, maximo, alCambiar }: ContadorProps) {
  const cambiar = (nuevo: number) => {
    vibrar('toque')
    alCambiar(Math.min(maximo, Math.max(minimo, nuevo)))
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-bg px-4 py-3 short:py-2">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{etiqueta}</p>
        {detalle && <p className="text-[11px] text-muted">{detalle}</p>}
      </div>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label={`Menos ${etiqueta.toLowerCase()}`}
          disabled={valor <= minimo}
          onClick={() => cambiar(valor - 1)}
          className={boton}
        >
          <Minus className="size-4" />
        </button>
        <strong className="w-8 text-center text-2xl font-extrabold tabular-nums short:text-xl">
          {valor}
        </strong>
        <button
          type="button"
          aria-label={`Más ${etiqueta.toLowerCase()}`}
          disabled={valor >= maximo}
          onClick={() => cambiar(valor + 1)}
          className={boton}
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  )
}
