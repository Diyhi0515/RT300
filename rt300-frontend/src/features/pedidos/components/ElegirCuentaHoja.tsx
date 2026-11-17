import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { formatoMoneda } from '@/features/salon/formato'
import { HojaInferior } from '@/shared/ui/HojaInferior'
import { filtrarCuentas, totalCuenta } from '../calculos'
import type { Cuenta } from '../types'

interface ElegirCuentaHojaProps {
  abierta: boolean
  cuentas: Cuenta[]
  seleccionada: number
  alElegir: (cuenta: Cuenta) => void
  alCerrar: () => void
}

export function ElegirCuentaHoja({
  abierta,
  cuentas,
  seleccionada,
  alElegir,
  alCerrar,
}: ElegirCuentaHojaProps) {
  const [texto, setTexto] = useState('')
  const visibles = filtrarCuentas(cuentas, texto)

  useEffect(() => {
    if (!abierta) return
    const temporizador = window.setTimeout(() => {
      document
        .getElementById(`hoja-cuenta-${seleccionada}`)
        ?.scrollIntoView({ block: 'center', behavior: 'auto' })
    }, 60)
    return () => window.clearTimeout(temporizador)
  }, [abierta, seleccionada])

  const cerrar = () => {
    setTexto('')
    alCerrar()
  }

  return (
    <HojaInferior abierta={abierta} alCerrar={cerrar} titulo="Elegir cuenta">
      <div className="sticky top-0 z-10 space-y-3 bg-surface px-5 pb-3 pt-1">
        <div className="flex items-baseline justify-between gap-2 pr-10">
          <h3 className="text-lg font-extrabold">Elegir cuenta</h3>
          <span className="text-xs font-semibold text-muted">
            {visibles.length === cuentas.length
              ? `${cuentas.length} cuentas`
              : `${visibles.length} de ${cuentas.length}`}
          </span>
        </div>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value.toUpperCase())}
            aria-label="Buscar cuenta"
            placeholder="Número, nombre, código o NIT"
            autoComplete="off"
            className="h-12 w-full rounded-xl border border-line bg-surface pl-9 pr-10 text-base font-medium outline-none transition focus:border-club-pc focus:ring-2 focus:ring-club-pc/25"
          />
          {texto && (
            <button
              type="button"
              onClick={() => setTexto('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-muted transition hover:bg-club-pc/10 hover:text-fg active:scale-90"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {visibles.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted">Ninguna cuenta coincide.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 px-5 pb-6 sm:grid-cols-3">
          {visibles.map((c) => {
            const activa = c.numero === seleccionada
            return (
              <li key={c.numero}>
                <button
                  id={`hoja-cuenta-${c.numero}`}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => {
                    alElegir(c)
                    cerrar()
                  }}
                  className={`flex min-h-[4rem] w-full cursor-pointer items-center gap-2 rounded-xl border p-2 text-left transition active:scale-95 ${
                    activa
                      ? 'border-club-pc bg-club-pc/10 ring-2 ring-club-pc'
                      : 'border-line bg-surface hover:border-club-pc/50'
                  }`}
                >
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-lg text-base font-extrabold tabular-nums ${
                      activa
                        ? 'bg-gradient-to-br from-club-pc to-club-tertiary text-white'
                        : 'bg-line/60 text-muted'
                    }`}
                  >
                    {c.numero}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">{c.nombre}</span>
                    {(c.codigoCliente || c.nit) && (
                      <span className="block truncate text-[10px] font-medium text-muted">
                        {[c.codigoCliente, c.nit && `NIT ${c.nit}`].filter(Boolean).join(' · ')}
                      </span>
                    )}
                    <span className="block text-[13px] font-extrabold leading-tight tabular-nums">
                      {formatoMoneda(totalCuenta(c))}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </HojaInferior>
  )
}
