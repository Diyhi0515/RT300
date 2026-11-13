import { useEffect, useState } from 'react'
import {
  BadgeCheck,
  Check,
  Clock,
  DoorOpen,
  LayoutList,
  Pencil,
  Plus,
  Printer,
  UserRound,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import { formatoMoneda, formatoNumero, tiempoTranscurrido } from '@/features/salon/formato'
import { useNavigate } from 'react-router-dom'
import { vibrar } from '@/lib/vibrar'
import { notificar } from '@/shared/avisos/almacen'
import { totalCuenta } from '../calculos'
import {
  useActualizarCuenta,
  useHabilitarMesa,
  useImprimirCuenta,
  useModificarMesa,
} from '../hooks'
import { usePedidos } from '../store'
import type { DatosCuenta, MesaDetalle } from '../types'
import { ConfirmarAccion } from './ConfirmarAccion'
import { Contador } from './Contador'
import { TodasLasCuentas } from './TodasLasCuentas'

interface ResumenMesaProps {
  mesa: MesaDetalle
}

const COLUMNAS = 'grid-cols-[minmax(0,1fr)_2rem_3.6rem_4.2rem]'

const MAXIMO_CUENTAS = 50

const accion =
  'flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-semibold transition hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 short:h-10'

export function ResumenMesa({ mesa }: ResumenMesaProps) {
  const cuentaActiva = usePedidos((s) => s.cuentaActiva)
  const { abrirCuenta, abrirComanda } = usePedidos.getState()
  const modificar = useModificarMesa()
  const actualizar = useActualizarCuenta()
  const habilitar = useHabilitarMesa()
  const imprimir = useImprimirCuenta()
  const navigate = useNavigate()
  const [editando, setEditando] = useState(false)
  const [verTodas, setVerTodas] = useState(false)
  const [eliminando, setEliminando] = useState<number | null>(null)
  const [renombrando, setRenombrando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [confirmando, setConfirmando] = useState<'liberar' | null>(null)
  const [comensales, setComensales] = useState(mesa.comensales)
  const [cuentas, setCuentas] = useState(mesa.cuentas.length)

  const cuenta = mesa.cuentas.find((c) => c.numero === cuentaActiva) ?? mesa.cuentas[0]
  const numeroActivo = cuenta?.numero
  const cuentaAEliminar = mesa.cuentas.find((c) => c.numero === eliminando)
  const trabajando = modificar.isPending || actualizar.isPending || habilitar.isPending

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
  const sinConsumo = mesa.cuentas.every((c) => c.lineas.length === 0 && !c.liquidada)
  const puedeAgregar = mesa.cuentas.length < MAXIMO_CUENTAS
  const puedeEliminar = (numero: number) =>
    mesa.cuentas.length > 1 && numero === mesa.cuentas.length && sinConsumo
  const totalActiva = cuenta ? totalCuenta(cuenta) : 0

  const cambiarMesa = async (totalCuentas: number, totalComensales: number) => {
    try {
      await modificar.mutateAsync({
        folio: mesa.folio,
        ccom: totalComensales,
        ncta: totalCuentas,
      })
      return true
    } catch {
      return false
    }
  }

  const guardarDatos = async () => {
    if (!(await cambiarMesa(cuentas, comensales))) return
    setEditando(false)
    vibrar('exito')
    notificar.exito('Se actualizaron los datos de la mesa.', `Mesa ${mesa.codigo}`)
  }

  const actualizarDatos = async (numero: number, datos: DatosCuenta) => {
    try {
      await actualizar.mutateAsync({
        folio: mesa.folio,
        cuenta: numero,
        mesa: mesa.codigo,
        cage: Number(datos.codigoCliente) || 0,
        nruc: datos.nit,
        nomb: datos.nombre,
      })
    } catch {
      return
    }
    vibrar('exito')
    notificar.exito(`Se actualizó la cuenta ${numero}.`, `Mesa ${mesa.codigo}`)
  }

  const guardarNombre = async () => {
    const limpio = nombre.trim()
    if (cuenta && limpio) {
      await actualizarDatos(cuenta.numero, {
        nombre: limpio,
        codigoCliente: cuenta.codigoCliente ?? '',
        nit: cuenta.nit ?? '',
      })
    }
    setRenombrando(false)
  }

  const agregarCuenta = async () => {
    if (await cambiarMesa(mesa.cuentas.length + 1, mesa.comensales)) vibrar('toque')
  }

  const imprimirCuenta = async () => {
    if (!cuenta) return
    try {
      await imprimir.mutateAsync({
        folio: mesa.folio,
        cuenta: cuenta.numero,
        mesa: mesa.codigo,
        cven: String(mesa.codigoMozo ?? 0),
        caco: mesa.areaId,
      })
    } catch {
      return
    }
    vibrar('exito')
    notificar.exito(`Se envió a imprimir la cuenta ${cuenta.numero}.`, `Mesa ${mesa.codigo}`)
  }

  const habilitarMesa = async () => {
    try {
      await habilitar.mutateAsync({ mesa: mesa.codigo, folio: mesa.folio })
    } catch {
      return
    }
    abrirCuenta(null)
    vibrar('exito')
    notificar.exito('La mesa quedó libre.', `Mesa ${mesa.codigo} habilitada`)
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

      {editando ? (
        <div className="space-y-3 rounded-2xl border border-line p-3">
          <h4 className="text-sm font-bold text-primary">Datos de la mesa</h4>
          <Contador
            etiqueta="Comensales"
            valor={comensales}
            minimo={1}
            maximo={Math.max(mesa.capacidad + 4, 12, mesa.comensales)}
            alCambiar={setComensales}
          />
          <Contador
            etiqueta="Cuentas"
            detalle={`Mínimo ${minimoCuentas} por consumo existente`}
            valor={cuentas}
            minimo={minimoCuentas}
            maximo={MAXIMO_CUENTAS}
            alCambiar={setCuentas}
          />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={accion} onClick={() => setEditando(false)}>
              Cancelar
            </button>
            <button
              type="button"
              disabled={trabajando}
              onClick={() => void guardarDatos()}
              className="flex h-11 cursor-pointer items-center justify-center rounded-xl bg-club-pc text-sm font-bold text-white transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {modificar.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      ) : verTodas ? (
        <TodasLasCuentas
          cuentas={mesa.cuentas}
          activa={numeroActivo}
          puedeAgregar={puedeAgregar}
          puedeEliminar={puedeEliminar}
          alElegir={(numero) => {
            abrirCuenta(numero)
            setRenombrando(false)
            setVerTodas(false)
          }}
          alActualizar={(numero, datos) => void actualizarDatos(numero, datos)}
          alEditarCuentas={() => navigate(`/pedidos/cuentas/${encodeURIComponent(mesa.codigo)}`)}
          alEliminar={setEliminando}
          alAgregar={() => void agregarCuenta()}
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
                disabled={trabajando}
                onClick={() => void agregarCuenta()}
                className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border border-dashed border-club-pc/60 text-club-primary transition hover:bg-club-pc/10 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
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
                      void guardarNombre()
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
                    disabled={cuenta.lineas.length === 0 || imprimir.isPending}
                    onClick={() => void imprimirCuenta()}
                  >
                    <Printer className="size-4" />
                    {imprimir.isPending ? 'Enviando...' : 'Imprimir cuenta'}
                  </button>
                  <button type="button" className={accion} onClick={() => setEditando(true)}>
                    <Pencil className="size-4" />
                    Datos de mesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmando('liberar')}
                    className={`${accion} col-span-2 border-danger/40 text-danger hover:border-danger hover:bg-danger/10`}
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
        mensaje={`Se eliminará la cuenta ${cuentaAEliminar?.numero ?? ''}. Solo se puede mientras la mesa no tenga comandas.`}
        textoConfirmar="Eliminar"
        alCancelar={() => setEliminando(null)}
        alConfirmar={() => {
          const eliminada = cuentaAEliminar
          setEliminando(null)
          if (!eliminada) return
          void cambiarMesa(mesa.cuentas.length - 1, mesa.comensales).then((hecho) => {
            if (!hecho) return
            abrirCuenta(null)
            vibrar('exito')
            notificar.exito(`Se eliminó la cuenta ${eliminada.numero}.`, `Mesa ${mesa.codigo}`)
          })
        }}
      />
      <ConfirmarAccion
        abierto={confirmando === 'liberar'}
        peligro
        titulo="Habilitar la mesa"
        mensaje={`Se cerrará la mesa ${mesa.codigo} y quedará libre. Solo se puede si no tiene comandas.`}
        textoConfirmar="Habilitar"
        alCancelar={() => setConfirmando(null)}
        alConfirmar={() => {
          setConfirmando(null)
          void habilitarMesa()
        }}
      />
    </div>
  )
}
