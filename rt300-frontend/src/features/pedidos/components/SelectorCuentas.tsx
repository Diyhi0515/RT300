import { useState } from 'react'
import { ChevronLeft, ChevronRight, LayoutGrid, Users } from 'lucide-react'
import { ordenarCuentas } from '../calculos'
import type { Cuenta } from '../types'
import { ElegirCuentaHoja } from './ElegirCuentaHoja'

interface SelectorCuentasProps {
  cuentas: Cuenta[]
  seleccionada: number
  alElegir: (cuenta: Cuenta) => void
}

const botonFlecha =
  'grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl border border-line bg-bg text-fg transition hover:border-club-pc/50 active:scale-90 disabled:cursor-not-allowed disabled:opacity-35'

export function SelectorCuentas({
  cuentas: sinOrden,
  seleccionada,
  alElegir,
}: SelectorCuentasProps) {
  const cuentas = ordenarCuentas(sinOrden)
  const [hojaAbierta, setHojaAbierta] = useState(false)
  const posicion = cuentas.findIndex((c) => c.numero === seleccionada)
  const actual = cuentas[posicion] ?? cuentas[0]
  const anterior = posicion > 0 ? cuentas[posicion - 1] : undefined
  const siguiente =
    posicion >= 0 && posicion < cuentas.length - 1 ? cuentas[posicion + 1] : undefined

  return (
    <section aria-label="Cuenta a editar" className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Users className="size-4 text-club-primary" aria-hidden />
          Cuenta a editar
        </h2>
        <button
          type="button"
          onClick={() => setHojaAbierta(true)}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-club-primary transition hover:bg-club-pc/10 active:scale-95"
        >
          <LayoutGrid className="size-3.5" aria-hidden />
          Ver todas ({cuentas.length})
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-2 shadow-[0_8px_22px_rgba(1,21,38,.05)]">
        <button
          type="button"
          onClick={() => setHojaAbierta(true)}
          aria-label="Elegir otra cuenta"
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl p-1 text-left transition hover:bg-club-pc/5 active:scale-[0.99]"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-club-pc to-club-tertiary text-lg font-extrabold tabular-nums text-white shadow-md shadow-club-pc/30">
            {actual.numero}
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-sm font-bold">{actual.nombre}</strong>
            <small className="block truncate text-xs text-muted">
              Cuenta {posicion + 1} de {cuentas.length}
              {actual.codigoCliente && (
                <span className="hidden sm:inline"> · Cliente {actual.codigoCliente}</span>
              )}
            </small>
          </span>
        </button>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            aria-label="Cuenta anterior"
            disabled={!anterior}
            onClick={() => anterior && alElegir(anterior)}
            className={botonFlecha}
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Cuenta siguiente"
            disabled={!siguiente}
            onClick={() => siguiente && alElegir(siguiente)}
            className={botonFlecha}
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      <ElegirCuentaHoja
        abierta={hojaAbierta}
        cuentas={cuentas}
        seleccionada={seleccionada}
        alElegir={alElegir}
        alCerrar={() => setHojaAbierta(false)}
      />
    </section>
  )
}
