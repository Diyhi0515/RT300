import { useCallback, useEffect, useRef } from 'react'
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

const ESPERA_INICIAL_MS = 400
const INTERVALO_MS = 90

const boton =
  'grid size-11 cursor-pointer touch-manipulation select-none place-items-center rounded-xl border border-line bg-surface transition hover:border-primary/60 hover:bg-primary/10 active:scale-90 disabled:cursor-not-allowed disabled:opacity-35 short:size-9'

export function Contador({ etiqueta, detalle, valor, minimo, maximo, alCambiar }: ContadorProps) {
  const limiteInferior = Math.max(0, minimo)
  const actual = useRef(valor)
  const temporizador = useRef<number | null>(null)
  const alCambiarRef = useRef(alCambiar)

  useEffect(() => {
    actual.current = valor
    alCambiarRef.current = alCambiar
  }, [valor, alCambiar])

  const detener = useCallback(() => {
    if (temporizador.current !== null) window.clearTimeout(temporizador.current)
    temporizador.current = null
  }, [])

  useEffect(() => detener, [detener])

  const dar = useCallback(
    (delta: number) => {
      const nuevo = Math.min(maximo, Math.max(limiteInferior, actual.current + delta))
      if (nuevo === actual.current) {
        detener()
        return false
      }
      actual.current = nuevo
      vibrar('toque')
      alCambiarRef.current(nuevo)
      return true
    },
    [maximo, limiteInferior, detener],
  )

  const iniciar = (delta: number) => {
    detener()
    if (!dar(delta)) return
    const repetir = () => {
      if (!dar(delta)) return
      temporizador.current = window.setTimeout(repetir, INTERVALO_MS)
    }
    temporizador.current = window.setTimeout(repetir, ESPERA_INICIAL_MS)
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
          disabled={valor <= limiteInferior}
          className={boton}
          onPointerDown={(e) => {
            if (e.button === 0) iniciar(-1)
          }}
          onPointerUp={detener}
          onPointerLeave={detener}
          onPointerCancel={detener}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              dar(-1)
            }
          }}
          onClick={(e) => e.preventDefault()}
        >
          <Minus className="size-4" />
        </button>
        <strong className="w-[3.4ch] text-center text-2xl font-extrabold tabular-nums short:text-xl">
          {valor}
        </strong>
        <button
          type="button"
          aria-label={`Más ${etiqueta.toLowerCase()}`}
          disabled={valor >= maximo}
          className={boton}
          onPointerDown={(e) => {
            if (e.button === 0) iniciar(1)
          }}
          onPointerUp={detener}
          onPointerLeave={detener}
          onPointerCancel={detener}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              dar(1)
            }
          }}
          onClick={(e) => e.preventDefault()}
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  )
}
