import { useEffect, useState } from 'react'
import {
  BadgeCheck,
  Check,
  Clock,
  DoorOpen,
  LayoutList,
  Pencil,
  Plus,
  Receipt,
  UserRound,
  Users,
  UtensilsCrossed,
  Wallet,
  X,
} from 'lucide-react'
import { formatoMoneda, formatoNumero, tiempoTranscurrido } from '@/features/salon/formato'
import { useNavigate } from 'react-router-dom'
import { vibrar } from '@/lib/vibrar'
import { notificar } from '@/shared/avisos/almacen'
import { totalCuenta } from '../calculos'
import { usePedidos } from '../store'
import type { MesaPlano } from '../types'
import { ConfirmarAccion } from './ConfirmarAccion'
import { Contador } from './Contador'
import { TodasLasCuentas } from './TodasLasCuentas'

interface ResumenMesaProps {
  mesa: MesaPlano
}

const COLUMNAS = 'grid-cols-[minmax(0,1fr)_2rem_3.6rem_4.2rem]'

const accion =
  'flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-semibold transition hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 short:h-10'

export function ResumenMesa({ mesa }: ResumenMesaProps) {
  const cuentaActiva = usePedidos((s) => s.cuentaActiva)
  const {
    abrirCuenta,
    abrirComanda,
    modificar,
    pedirCuenta,
    liquidarCuenta,
    liberar,
    agregarCuenta,
    renombrarCuenta,
    actualizarCuenta,
    eliminarCuenta,
  } = usePedidos.getState()
  const navigate = useNavigate()
  const [editando, setEditando] = useState(false)
  const [verTodas, setVerTodas] = useState(false)
  const [eliminando, setEliminando] = useState<number | null>(null)
  const [renombrando, setRenombrando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [confirmando, setConfirmando] = useState<'liquidar' | 'liberar' | null>(null)
  const [comensales, setComensales] = useState(mesa.comensales)
  const [cuentas, setCuentas] = useState(mesa.cuentas.length)

  const cuenta = mesa.cuentas.find((c) => c.numero === cuentaActiva) ?? mesa.cuentas[0]
  const numeroActivo = cuenta?.numero
  const cuentaAEliminar = mesa.cuentas.find((c) => c.numero === eliminando)

  useEffect(() => {
    if (numeroActivo === undefined) return
    document
      .getElementById(`cta-${numeroActivo}`)
      ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [numeroActivo])

  const minimoCuentas = Math.max(
    1,
    ...mesa.cuentas.filter((c) => c.lineas.length > 0 || c.liquidada).map((c) => c.numero),
  )
  const puedeAgregar = mesa.estado === 'ocupada' && mesa.cuentas.length < mesa.comensales
  const totalActiva = cuenta ? totalCuenta(cuenta) : 0

  const guardarDatos = () => {
    modificar(mesa.codigo, comensales, cuentas)
    setEditando(false)
    vibrar('exito')
    notificar.exito('Se actualizaron los datos de la mesa.', `Mesa ${mesa.codigo}`)
  }

  const guardarNombre = () => {
    const limpio = nombre.trim()
    if (cuenta && limpio) renombrarCuenta(mesa.codigo, cuenta.numero, limpio)
    setRenombrando(false)
  }

  return (
    <div className="space-y-4 p-5 short:space-y-2.5 short:p-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-xs">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-semibold text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5 text-primary" aria-hidden />
            Comensales: <strong className="text-fg">{mesa.comensales}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="size-3.5 text-primary" aria-hidden />
            Mozo: <strong className="text-fg">{mesa.mozo ?? '-'}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5 text-primary" aria-hidden />
            <strong className="text-fg">
              {mesa.apertura ? tiempoTranscurrido(mesa.apertura) : '-'}
            </strong>
          </span>
        </p>
      </div>

      {mesa.estado === 'cobro' && (
        <p className="flex items-center gap-2 rounded-xl bg-accent-solid/15 px-3.5 py-2.5 text-sm font-semibold text-amber-800 dark:text-amber-200">
          <Receipt className="size-[18px] shrink-0" />
          La cuenta fue solicitada. Liquida las cuentas para cerrar la mesa.
        </p>
      )}

      {editando ? (
        <div className="space-y-3 rounded-2xl border border-line p-3">
          <h4 className="text-sm font-bold text-primary">Datos de la mesa</h4>
          <Contador
            etiqueta="Comensales"
            valor={comensales}
            minimo={1}
            maximo={Math.max(mesa.capacidad + 4, 12)}
            alCambiar={(v) => {
              setComensales(v)
              if (cuentas > v) setCuentas(Math.max(v, minimoCuentas))
            }}
          />
          <Contador
            etiqueta="Cuentas"
            detalle={`Mínimo ${minimoCuentas} por consumo existente`}
            valor={cuentas}
            minimo={minimoCuentas}
            maximo={Math.max(comensales, minimoCuentas)}
            alCambiar={setCuentas}
          />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={accion} onClick={() => setEditando(false)}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardarDatos}
              className="flex h-11 cursor-pointer items-center justify-center rounded-xl bg-club-pc text-sm font-bold text-white transition hover:brightness-110 active:scale-[0.98]"
            >
              Guardar
            </button>
          </div>
        </div>
      ) : verTodas ? (
        <TodasLasCuentas
          cuentas={mesa.cuentas}
          activa={numeroActivo}
          puedeAgregar={puedeAgregar}
          alElegir={(numero) => {
            abrirCuenta(numero)
            setRenombrando(false)
            setVerTodas(false)
          }}
          alActualizar={(numero, datos) => actualizarCuenta(mesa.codigo, numero, datos)}
          alEditarCuentas={() => navigate(`/pedidos/cuentas/${mesa.codigo}`)}
          alEliminar={setEliminando}
          alAgregar={() => {
            agregarCuenta(mesa.codigo)
            vibrar('toque')
          }}
          alVolver={() => setVerTodas(false)}
        />
      ) : (
        <>
          {mesa.cuentas.length > 1 && (
            <div className="-mb-1 flex justify-end">
              <button
                type="button"
                onClick={() => setVerTodas(true)}
                className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-club-primary transition hover:bg-club-pc/10 active:scale-95"
              >
                <LayoutList className="size-3.5" aria-hidden />
                Ver más cuentas
              </button>
            </div>
          )}
          <div
            role="tablist"
            aria-label="Cuentas de la mesa"
            className="-mx-5 -my-1.5 flex gap-2 overflow-x-auto px-5 py-2 [scrollbar-width:none] short:-mx-3 short:px-3 [&::-webkit-scrollbar]:hidden"
          >
            {mesa.cuentas.map((c) => {
              const activa = c.numero === numeroActivo
              return (
                <button
                  key={c.numero}
                  id={`cta-${c.numero}`}
                  type="button"
                  role="tab"
                  aria-selected={activa}
                  onClick={() => {
                    abrirCuenta(c.numero)
                    setRenombrando(false)
                  }}
                  className={`inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3.5 text-sm font-bold tabular-nums transition duration-200 active:scale-95 ${
                    activa
                      ? 'bg-gradient-to-r from-club-pc to-club-tertiary text-white shadow-[0_4px_12px_rgba(43,83,184,.35)]'
                      : 'border border-line bg-surface text-fg hover:border-club-pc/50'
                  }`}
                >
                  {c.liquidada && <BadgeCheck className="size-4 text-emerald-400" aria-hidden />}
                  Cta {c.numero}
                  <span className={activa ? 'text-white/80' : 'text-muted'}>
                    · Bs {Math.round(totalCuenta(c))}
                  </span>
                </button>
              )
            })}
            {puedeAgregar && (
              <button
                type="button"
                aria-label="Agregar cuenta"
                onClick={() => {
                  agregarCuenta(mesa.codigo)
                  vibrar('toque')
                }}
                className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border border-dashed border-club-pc/60 text-club-primary transition hover:bg-club-pc/10 active:scale-90"
              >
                <Plus className="size-4" />
              </button>
            )}
          </div>

          {cuenta && (
            <>
              <div className="flex items-center justify-between gap-2">
                {renombrando ? (
                  <form
                    className="flex min-w-0 flex-1 items-center gap-1.5"
                    onSubmit={(e) => {
                      e.preventDefault()
                      guardarNombre()
                    }}
                  >
                    <input
                      autoFocus
                      value={nombre}
                      maxLength={28}
                      onChange={(e) => setNombre(e.target.value)}
                      onKeyDown={(e) => e.key === 'Escape' && setRenombrando(false)}
                      aria-label="Nombre de la cuenta"
                      className="h-10 min-w-0 flex-1 rounded-xl border border-club-pc bg-bg px-3 text-base font-semibold outline-none ring-4 ring-club-pc/15 short:h-9"
                    />
                    <button
                      type="submit"
                      aria-label="Guardar nombre"
                      className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl bg-club-pc text-white active:scale-90"
                    >
                      <Check className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Cancelar"
                      onClick={() => setRenombrando(false)}
                      className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border border-line active:scale-90"
                    >
                      <X className="size-4" />
                    </button>
                  </form>
                ) : (
                  <>
                    <h4 className="min-w-0 truncate text-sm font-bold">
                      Cuenta {cuenta.numero}
                      <span className="font-medium text-muted"> · {cuenta.nombre}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setNombre(cuenta.nombre)
                        setRenombrando(true)
                      }}
                      className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-club-primary transition hover:bg-club-pc/10 active:scale-95"
                    >
                      <Pencil className="size-3.5" />
                      Datos cuenta
                    </button>
                  </>
                )}
              </div>

              <div className="overflow-hidden rounded-2xl border border-line">
                <div
                  className={`grid ${COLUMNAS} gap-x-2 bg-club-pc/10 px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-club-primary`}
                >
                  <span>Descripción</span>
                  <span className="text-center">Cant</span>
                  <span className="text-right">P. unit</span>
                  <span className="text-right">Total</span>
                </div>
                {cuenta.lineas.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-7 text-center short:py-4">
                    <UtensilsCrossed className="size-6 text-muted" aria-hidden />
                    <p className="text-sm text-muted">Esta cuenta todavía no tiene pedidos.</p>
                  </div>
                ) : (
                  <ul className="max-h-[min(34dvh,16rem)] divide-y divide-line overflow-y-auto overscroll-contain short:max-h-[28dvh]">
                    {cuenta.lineas.map((l) => (
                      <li
                        key={l.id}
                        className={`grid ${COLUMNAS} items-start gap-x-2 px-3 py-2.5 text-sm`}
                      >
                        <span className="min-w-0">
                          <strong className="block font-semibold leading-tight">{l.nombre}</strong>
                          {l.nota && (
                            <small className="mt-0.5 block text-[11px] font-medium leading-tight text-club-secondary">
                              {l.nota}
                            </small>
                          )}
                        </span>
                        <span className="text-center font-extrabold tabular-nums">
                          {l.cantidad}
                        </span>
                        <span className="text-right tabular-nums text-muted">
                          {formatoNumero(l.precio)}
                        </span>
                        <span className="text-right font-extrabold tabular-nums">
                          {formatoNumero(l.cantidad * l.precio)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-club-pc to-club-tertiary p-4 text-white shadow-[0_14px_30px_rgba(43,83,184,.4)] short:px-3 short:py-2">
                <div className="relative flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] short:text-[10px] font-extrabold uppercase tracking-wider text-white/75">
                      Total consumo
                    </p>
                  </div>
                  <strong className="text-3xl font-extrabold leading-none tracking-tight tabular-nums short:text-xl">
                    {formatoMoneda(totalActiva)}
                  </strong>
                </div>
              </div>

              <div className="grid gap-2">
                <button
                  type="button"
                  disabled={cuenta.liquidada}
                  onClick={() => abrirComanda(cuenta.numero)}
                  className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-club-pc to-club-tertiary text-base font-bold text-white shadow-[0_10px_24px_rgba(43,83,184,.35)] transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none short:h-10 short:text-sm"
                >
                  <UtensilsCrossed className="size-5" />
                  Nueva comanda
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={accion}
                    disabled={mesa.estado === 'cobro'}
                    onClick={() => {
                      pedirCuenta(mesa.codigo)
                      vibrar('exito')
                      notificar.informacion(
                        'Se avisó a caja que la mesa pidió la cuenta.',
                        `Mesa ${mesa.codigo}`,
                      )
                    }}
                  >
                    <Receipt className="size-4" />
                    Pedir cuenta
                  </button>
                  <button
                    type="button"
                    className={accion}
                    disabled={cuenta.liquidada || cuenta.lineas.length === 0}
                    onClick={() => setConfirmando('liquidar')}
                  >
                    <Wallet className="size-4" />
                    Liquidar cuenta
                  </button>
                  <button type="button" className={accion} onClick={() => setEditando(true)}>
                    <Pencil className="size-4" />
                    Datos de mesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmando('liberar')}
                    className={`${accion} border-danger/40 text-danger hover:border-danger hover:bg-danger/10`}
                  >
                    <DoorOpen className="size-4" />
                    Habilitar mesa
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <ConfirmarAccion
        abierto={cuentaAEliminar !== undefined}
        peligro
        titulo="Eliminar la cuenta"
        mensaje={
          cuentaAEliminar && cuentaAEliminar.lineas.length > 0
            ? `La cuenta ${cuentaAEliminar.numero} (${cuentaAEliminar.nombre}) tiene ${cuentaAEliminar.lineas.length} ${cuentaAEliminar.lineas.length === 1 ? 'pedido' : 'pedidos'} por ${formatoMoneda(totalCuenta(cuentaAEliminar))}. Se eliminarán la cuenta y todos sus pedidos. Esta acción no se puede deshacer.`
            : `Se eliminará la cuenta ${cuentaAEliminar?.numero ?? ''}. Esta acción no se puede deshacer.`
        }
        textoConfirmar="Eliminar"
        alCancelar={() => setEliminando(null)}
        alConfirmar={() => {
          const eliminada = cuentaAEliminar
          setEliminando(null)
          if (!eliminada) return
          eliminarCuenta(mesa.codigo, eliminada.numero)
          vibrar('exito')
          notificar.exito(`Se eliminó la cuenta ${eliminada.numero}.`, `Mesa ${mesa.codigo}`)
        }}
      />
      <ConfirmarAccion
        abierto={confirmando === 'liquidar'}
        titulo="Liquidar la cuenta"
        mensaje={`Se cobrarán ${formatoMoneda(totalActiva)} de la cuenta ${cuenta?.numero ?? ''}.`}
        textoConfirmar="Liquidar"
        alCancelar={() => setConfirmando(null)}
        alConfirmar={() => {
          setConfirmando(null)
          if (!cuenta) return
          liquidarCuenta(mesa.codigo, cuenta.numero)
          vibrar('exito')
          notificar.exito(
            `Se cobraron ${formatoMoneda(totalActiva)}.`,
            `Cuenta ${cuenta.numero} liquidada`,
          )
        }}
      />
      <ConfirmarAccion
        abierto={confirmando === 'liberar'}
        peligro
        titulo="Habilitar la mesa"
        mensaje={`Se cerrará la mesa ${mesa.codigo} y quedará libre. Las cuentas con consumo sin liquidar se perderán.`}
        textoConfirmar="Habilitar"
        alCancelar={() => setConfirmando(null)}
        alConfirmar={() => {
          setConfirmando(null)
          liberar(mesa.codigo)
          vibrar('exito')
          notificar.exito('La mesa quedó libre.', `Mesa ${mesa.codigo} habilitada`)
        }}
      />
    </div>
  )
}
