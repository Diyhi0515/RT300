import { memo } from 'react'
import { Minus, Plus } from 'lucide-react'
import { formatoMoneda } from '@/features/salon/formato'
import type { Plato } from '../types'

interface TarjetaProductoProps {
  plato: Plato
  cantidad: number
  indice: number
  alCambiarCantidad: (plato: Plato, delta: number) => void
}

const urlImagen = (cart: string) => `/api/v1/menu/platos/${encodeURIComponent(cart)}/imagen?w=320`

const boton =
  'grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl transition active:scale-90 short:size-9 lg:size-11'

function TarjetaProductoBase({ plato, cantidad, indice, alCambiarCantidad }: TarjetaProductoProps) {
  return (
    <li
      style={{ animationDelay: `${Math.min(indice, 8) * 15}ms` }}
      className={`flex animate-[chip-in_0.16s_ease-out_both] flex-col justify-between gap-2.5 rounded-2xl border-2 p-3 transition duration-200 short:p-2 lg:p-4 ${
        cantidad > 0
          ? 'border-primary bg-primary/10 shadow-[0_10px_26px_rgba(43,83,184,.28)]'
          : 'border-club-pc/40 bg-club-pc/10 hover:border-club-pc/80'
      }`}
    >
      {plato.imagen && (
        <img
          src={urlImagen(plato.id)}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-28 w-full rounded-xl bg-bg object-cover short:h-20 lg:h-32"
        />
      )}
      <h3 className="line-clamp-3 text-sm font-bold leading-tight [overflow-wrap:anywhere] lg:text-base">
        {plato.nombre}
      </h3>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <p className="shrink-0 text-sm font-extrabold tabular-nums text-primary lg:text-lg">
          {formatoMoneda(plato.precio)}
        </p>
        {cantidad === 0 ? (
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
              {cantidad}
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
}

export const TarjetaProducto = memo(TarjetaProductoBase)
