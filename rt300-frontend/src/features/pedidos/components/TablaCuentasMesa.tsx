import { useEffect, useRef } from 'react'
import { Users } from 'lucide-react'
import { formatoMoneda } from '@/features/salon/formato'
import { totalCuenta } from '../calculos'
import type { Cuenta } from '../types'

interface TablaCuentasMesaProps {
  cuentas: Cuenta[]
  seleccionada: number
  alElegir: (cuenta: Cuenta) => void
}

const COLUMNAS = 'grid-cols-[3.5rem_minmax(0,1.4fr)_5rem_6.5rem_5rem]'

export function TablaCuentasMesa({ cuentas, seleccionada, alElegir }: TablaCuentasMesaProps) {
  const filaActiva = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    filaActiva.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [seleccionada])

  return (
    <section
      aria-label="Cuentas de la mesa"
      className="overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_12px_32px_rgba(1,21,38,.06)] lg:flex lg:min-h-0 lg:flex-1 lg:flex-col"
    >
      <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-4 sm:px-5 lg:shrink-0 short:pb-1 short:pt-2">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Users className="size-4 text-club-primary" aria-hidden />
          Cuentas de la mesa
        </h2>
        <span className="rounded-md bg-line/60 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-muted">
          {cuentas.length}
        </span>
      </div>
      <div className="overflow-x-auto lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        <div className="min-w-[34rem] lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
          <div
            className={`grid ${COLUMNAS} gap-x-3 bg-club-pc/10 px-4 py-2 short:py-1 text-[10px] font-extrabold uppercase tracking-wide text-club-primary sm:px-5`}
          >
            <span>Cuenta</span>
            <span>Nombre</span>
            <span>Cliente</span>
            <span>NIT / CI</span>
            <span className="text-right">Total</span>
          </div>
          <ul className="max-h-[min(40dvh,22rem)] divide-y divide-line overflow-y-auto overscroll-contain lg:max-h-none lg:min-h-0 lg:flex-1">
            {cuentas.map((c) => {
              const activa = c.numero === seleccionada
              return (
                <li key={c.numero}>
                  <button
                    ref={activa ? filaActiva : undefined}
                    type="button"
                    onClick={() => alElegir(c)}
                    aria-pressed={activa}
                    className={`grid w-full cursor-pointer ${COLUMNAS} items-center gap-x-3 px-4 py-2.5 text-left text-sm transition sm:px-5 [@media(max-height:900px)]:lg:py-1.5 short:lg:py-1 ${
                      activa ? 'bg-club-pc/10' : 'hover:bg-club-pc/5'
                    }`}
                  >
                    <span
                      className={`grid size-8 place-items-center rounded-lg text-sm font-extrabold tabular-nums short:size-7 ${
                        activa
                          ? 'bg-gradient-to-br from-club-pc to-club-tertiary text-white'
                          : 'bg-line/60 text-muted'
                      }`}
                    >
                      {c.numero}
                    </span>
                    <span className="truncate font-semibold">{c.nombre}</span>
                    <span className="truncate text-muted">{c.codigoCliente || '-'}</span>
                    <span className="truncate tabular-nums text-muted">{c.nit || '-'}</span>
                    <span className="text-right font-bold tabular-nums">
                      {formatoMoneda(totalCuenta(c))}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
