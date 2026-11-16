import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ListChecks,
  MousePointerClick,
  Pencil,
  Plus,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react'
import { formatoMoneda } from '@/features/salon/formato'
import { estadoCuenta, ordenarCuentas, totalCuenta } from '../calculos'
import type { Cuenta, DatosCuenta } from '../types'
import { ConfirmarAccion } from './ConfirmarAccion'
import { EditarCuentaModal } from './EditarCuentaModal'

interface TodasLasCuentasProps {
  cuentas: Cuenta[]
  activa: number | undefined
  puedeAgregar: boolean
  puedeEliminar: (numero: number) => boolean
  alElegir: (numero: number) => void
  alActualizar: (numero: number, datos: DatosCuenta) => Promise<boolean>
  alEditarCuentas: () => void
  alEliminar: (numeros: number[]) => Promise<boolean>
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

const LIMITE_LISTA = 8

const listarNumeros = (numeros: number[]) => {
  const ordenados = [...numeros].sort((a, b) => a - b)
  if (ordenados.length <= LIMITE_LISTA) return ordenados.join(', ')
  return `${ordenados.slice(0, LIMITE_LISTA).join(', ')} y ${ordenados.length - LIMITE_LISTA} más`
}

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
  const [modoVarias, setModoVarias] = useState(false)
  const [seleccion, setSeleccion] = useState<number[]>([])
  const [porEliminar, setPorEliminar] = useState<number[] | null>(null)
  const lista = useRef<HTMLUListElement>(null)
  const cantidadPrevia = useRef(cuentas.length)

  useEffect(() => {
    if (cuentas.length > cantidadPrevia.current) {
      lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: 'smooth' })
    }
    cantidadPrevia.current = cuentas.length
  }, [cuentas.length])

  const ordenadas = ordenarCuentas(cuentas)
  const cuenta = cuentas.find((c) => c.numero === marcada) ?? ordenadas[0]
  const elegibles = cuentas.filter((c) => puedeEliminar(c.numero)).map((c) => c.numero)
  const elegidas = seleccion.filter((n) => elegibles.includes(n))
  const dejaSinCuentas = elegidas.length >= cuentas.length

  const salirDeSeleccion = () => {
    setModoVarias(false)
    setSeleccion([])
  }

  const alternar = (numero: number) =>
    setSeleccion((previa) =>
      previa.includes(numero) ? previa.filter((n) => n !== numero) : [...previa, numero],
    )

  const elegirVacias = () => {
    const todas = [...elegibles].sort((a, b) => a - b)
    setSeleccion(todas.length >= cuentas.length ? todas.slice(1) : todas)
  }

  const confirmarEliminacion = () => {
    const numeros = porEliminar ?? []
    setPorEliminar(null)
    if (numeros.length === 0) return
    void (async () => {
      if (await alEliminar(numeros)) salirDeSeleccion()
    })()
  }

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

      {modoVarias ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-danger">
            {elegidas.length === 0
              ? 'Toca las cuentas vacías que quieras eliminar.'
              : `${elegidas.length} ${elegidas.length === 1 ? 'seleccionada' : 'seleccionadas'}`}
          </p>
          <button
            type="button"
            onClick={elegirVacias}
            disabled={elegibles.length === 0}
            className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-club-primary transition hover:bg-club-pc/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ListChecks className="size-3.5" />
            Todas las vacías
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted">
            Toca una cuenta y usa Seleccionar para ver su detalle.
          </p>
          {elegibles.length > 0 && cuentas.length > 1 && (
            <button
              type="button"
              onClick={() => setModoVarias(true)}
              className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-club-primary transition hover:bg-club-pc/10 active:scale-95"
            >
              <ListChecks className="size-3.5" />
              Eliminar varias
            </button>
          )}
        </div>
      )}

      <ul
        ref={lista}
        tabIndex={0}
        aria-label="Lista de cuentas"
        className="grid max-h-[13.75rem] grid-cols-2 gap-2 overflow-y-auto overscroll-contain rounded-2xl p-1 outline-none [scrollbar-color:var(--color-club-pc)_transparent] [scrollbar-width:thin]"
      >
        {ordenadas.map((c, i) => {
          const estado = estadoCuenta(c)
          const estilo = ESTILO[estado]
          const eliminable = elegibles.includes(c.numero)
          const elegida = elegidas.includes(c.numero)
          const esMarcada = !modoVarias && c.numero === cuenta?.numero
          const bloqueada = modoVarias && !eliminable
          return (
            <li
              key={c.numero}
              style={{ animationDelay: `${Math.min(i, 8) * 15}ms` }}
              className={`relative min-h-[3.8rem] animate-[chip-in_0.16s_ease-out_both] rounded-xl border transition ${estilo.clases} ${
                elegida
                  ? 'ring-2 ring-danger'
                  : esMarcada
                    ? 'ring-2 ring-club-pc'
                    : bloqueada
                      ? 'opacity-45'
                      : 'hover:border-club-pc/60'
              }`}
            >
              <button
                type="button"
                disabled={bloqueada}
                onClick={() => {
                  if (modoVarias) {
                    alternar(c.numero)
                    return
                  }
                  setMarcada(c.numero)
                  setEditando(false)
                }}
                aria-pressed={modoVarias ? elegida : esMarcada}
                className="flex w-full cursor-pointer items-center gap-2 rounded-xl p-2 pr-8 text-left active:scale-[0.98] disabled:cursor-not-allowed"
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
              {modoVarias && eliminable && (
                <span
                  aria-hidden
                  className={`pointer-events-none absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-md border-2 ${
                    elegida ? 'border-danger bg-danger text-white' : 'border-line bg-surface'
                  }`}
                >
                  {elegida && <Check className="size-3.5" strokeWidth={3} />}
                </span>
              )}
              {!modoVarias && eliminable && cuentas.length > 1 && (
                <button
                  type="button"
                  onClick={() => setPorEliminar([c.numero])}
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

      {puedeAgregar && !modoVarias && (
        <button
          type="button"
          onClick={alAgregar}
          className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-club-pc/60 text-sm font-bold text-club-primary transition hover:bg-club-pc/10 active:scale-[0.98]"
        >
          <Plus className="size-4" />
          Nueva cuenta
        </button>
      )}

      {modoVarias ? (
        <>
          {dejaSinCuentas && (
            <p className="text-xs font-medium text-danger">
              Debe quedar al menos una cuenta en la mesa.
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={salirDeSeleccion}
              className={`${botonPie} border border-line bg-surface hover:border-club-pc/50`}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={elegidas.length === 0 || dejaSinCuentas}
              onClick={() => setPorEliminar(elegidas)}
              className={`${botonPie} bg-danger text-white hover:brightness-110`}
            >
              <Trash2 className="size-4" />
              Eliminar{elegidas.length > 0 ? ` (${elegidas.length})` : ''}
            </button>
          </div>
        </>
      ) : (
        <>
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
        </>
      )}

      {editando && cuenta && (
        <EditarCuentaModal
          key={cuenta.numero}
          cuenta={cuenta}
          alCerrar={() => setEditando(false)}
          alGuardar={(datos) => alActualizar(cuenta.numero, datos)}
        />
      )}

      <ConfirmarAccion
        abierto={porEliminar !== null}
        peligro
        titulo={
          porEliminar && porEliminar.length > 1 ? 'Eliminar las cuentas' : 'Eliminar la cuenta'
        }
        mensaje={
          porEliminar && porEliminar.length > 1
            ? `Se eliminarán ${porEliminar.length} cuentas (${listarNumeros(porEliminar)}). Si alguna no se puede eliminar, no se elimina ninguna. Esta acción no se puede deshacer.`
            : `Se eliminará la cuenta ${porEliminar?.[0] ?? ''}. Esta acción no se puede deshacer.`
        }
        textoConfirmar="Eliminar"
        alCancelar={() => setPorEliminar(null)}
        alConfirmar={confirmarEliminacion}
      />
    </section>
  )
}
