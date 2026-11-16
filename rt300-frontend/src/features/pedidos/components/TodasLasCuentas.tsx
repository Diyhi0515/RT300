import { useState } from 'react'
import { ArrowLeft, BadgeCheck, MousePointerClick, Pencil, Plus, UsersRound, X } from 'lucide-react'
import { formatoMoneda } from '@/features/salon/formato'
import { estadoCuenta, totalCuenta } from '../calculos'
import type { Cuenta, DatosCuenta } from '../types'
import { EditarCuentaModal } from './EditarCuentaModal'

interface TodasLasCuentasProps {
  cuentas: Cuenta[]
  activa: number | undefined
  puedeAgregar: boolean
  puedeEliminar: (numero: number) => boolean
  alElegir: (numero: number) => void
  alActualizar: (numero: number, datos: DatosCuenta) => Promise<boolean>
  alEditarCuentas: () => void
  alEliminar: (numero: number) => void
  alAgregar: () => void
  alVolver: () => void
}

const ESTILO = {
  vacia: {
    clases: 'border-line bg-surface',
    numero: 'bg-line/60 text-muted',
  },
  consumo: {
    clases: 'border-club-pc/40 bg-club-pc/[0.07]',
    numero:
      'bg-gradient-to-br from-club-pc to-club-tertiary text-white shadow-md shadow-club-pc/30',
  },
  liquidada: {
    clases: 'border-success/40 bg-success/[0.08]',
    numero: 'bg-success text-white dark:text-[#04140f]',
  },
} as const

const botonPie =
  'inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl text-sm font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40'

export function TodasLasCuentas({
  cuentas,
  activa,
  puedeAgregar,
  puedeEliminar,
  alElegir,
  alActualizar,
  alEditarCuentas,
  alEliminar,
  alAgregar,
  alVolver,
}: TodasLasCuentasProps) {
  const [marcada, setMarcada] = useState<number>(activa ?? cuentas[0]?.numero ?? 1)
  const [editando, setEditando] = useState(false)

  const cuenta = cuentas.find((c) => c.numero === marcada) ?? cuentas[0]

  return (
    <section aria-label="Todas las cuentas" className="space-y-3 short:space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-sm font-bold">
          Todas las cuentas
          <span className="rounded-md bg-line/60 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-muted">
            {cuentas.length}
          </span>
        </h4>
        <button
          type="button"
          onClick={alVolver}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-club-primary transition hover:bg-club-pc/10 active:scale-95"
        >
          <ArrowLeft className="size-3.5" />
          Volver
        </button>
      </div>
      <p className="text-xs text-muted">Toca una cuenta y usa Seleccionar para ver su detalle.</p>

      <ul
        tabIndex={0}
        aria-label="Lista de cuentas"
        className="grid max-h-[13.75rem] grid-cols-2 gap-2 overflow-y-auto overscroll-contain rounded-2xl p-1 outline-none [scrollbar-color:var(--color-club-pc)_transparent] [scrollbar-width:thin]"
      >
        {cuentas.map((c, i) => {
          const estado = estadoCuenta(c)
          const estilo = ESTILO[estado]
          const esMarcada = c.numero === cuenta?.numero
          return (
            <li
              key={c.numero}
              style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}
              className={`relative min-h-[3.8rem] animate-[chip-in_0.3s_ease-out_both] rounded-xl border transition ${estilo.clases} ${
                esMarcada ? 'ring-2 ring-club-pc' : 'hover:border-club-pc/60'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setMarcada(c.numero)
                  setEditando(false)
                }}
                aria-pressed={esMarcada}
                className="flex w-full cursor-pointer items-center gap-2 rounded-xl p-2 pr-8 text-left active:scale-[0.98]"
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-lg text-base font-extrabold tabular-nums ${estilo.numero}`}
                >
                  {c.numero}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-xs font-medium">
                    {estado === 'liquidada' && (
                      <BadgeCheck className="size-3.5 shrink-0 text-success" aria-hidden />
                    )}
                    <span className="truncate">{c.nombre}</span>
                  </span>
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
              {puedeEliminar(c.numero) && (
                <button
                  type="button"
                  onClick={() => alEliminar(c.numero)}
                  aria-label={`Eliminar la cuenta ${c.numero}`}
                  className="absolute right-1 top-1 grid size-7 cursor-pointer place-items-center rounded-lg text-muted transition hover:bg-danger/12 hover:text-danger active:scale-90"
                >
                  <X className="size-4" />
                </button>
              )}
            </li>
          )
        })}
      </ul>

      {puedeAgregar && (
        <button
          type="button"
          onClick={alAgregar}
          className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-club-pc/60 text-sm font-bold text-club-primary transition hover:bg-club-pc/10 active:scale-[0.98]"
        >
          <Plus className="size-4" />
          Nueva cuenta
        </button>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={!cuenta}
          onClick={() => cuenta && alElegir(cuenta.numero)}
          className={`${botonPie} bg-club-pc text-white hover:brightness-110`}
        >
          <MousePointerClick className="size-4" />
          Seleccionar
        </button>
        <button
          type="button"
          disabled={!cuenta}
          onClick={() => setEditando(true)}
          className={`${botonPie} border border-line bg-surface text-club-primary hover:border-club-pc/50`}
        >
          <Pencil className="size-4" />
          Editar
        </button>
      </div>
      <button
        type="button"
        onClick={alEditarCuentas}
        className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-club-pc/40 bg-club-pc/[0.07] text-sm font-bold text-club-primary transition hover:bg-club-pc/15 active:scale-[0.98]"
      >
        <UsersRound className="size-4" />
        Editar cuentas
      </button>
      {editando && cuenta && (
        <EditarCuentaModal
          key={cuenta.numero}
          cuenta={cuenta}
          alCerrar={() => setEditando(false)}
          alGuardar={(datos) => alActualizar(cuenta.numero, datos)}
        />
      )}
    </section>
  )
}
