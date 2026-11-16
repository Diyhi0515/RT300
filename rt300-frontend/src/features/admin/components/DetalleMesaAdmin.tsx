import { useState } from 'react'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { tiempoCorto, totalCuenta } from '@/features/pedidos/calculos'
import { useAreas, useMesaDetalle } from '@/features/pedidos/hooks'
import { usePedidos } from '@/features/pedidos/store'
import type { Cuenta } from '@/features/pedidos/types'
import { InsigniaEstado } from '@/features/salon/components/InsigniaEstado'
import { formatoMoneda } from '@/features/salon/formato'
import { Modal } from '@/shared/ui/Modal'

interface DetalleMesaAdminProps {
  codigo: string | null
  alCerrar: () => void
}

const tieneConsumo = (cuenta: Cuenta) => cuenta.lineas.length > 0

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-bg px-3 py-2.5">
      <dt className="text-[11px] text-muted">{etiqueta}</dt>
      <dd className="break-words text-sm font-bold leading-tight tabular-nums">{valor}</dd>
    </div>
  )
}

function CuentaConsumo({ cuenta }: { cuenta: Cuenta }) {
  const unidades = cuenta.lineas.reduce((suma, l) => suma + l.cantidad, 0)
  return (
    <details className="group rounded-xl border border-line">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
        <ChevronDown className="size-4 shrink-0 text-muted transition group-open:rotate-180" />
        <span className="min-w-0 flex-1">
          <strong className="block truncate text-sm">{cuenta.nombre}</strong>
          <small className="text-xs text-muted">
            {unidades} {unidades === 1 ? 'producto' : 'productos'}
            {cuenta.liquidada ? ' · Liquidada' : ''}
          </small>
        </span>
        <strong className="shrink-0 text-sm tabular-nums">{formatoMoneda(totalCuenta(cuenta))}</strong>
      </summary>
      <ul className="space-y-1 border-t border-line px-3 py-2.5 text-sm">
        {cuenta.lineas.map((linea) => (
          <li key={linea.id} className="flex justify-between gap-3">
            <span className="min-w-0 break-words">
              {linea.cantidad} × {linea.nombre}
            </span>
            <span className="shrink-0 tabular-nums text-muted">
              {formatoMoneda(linea.cantidad * linea.precio)}
            </span>
          </li>
        ))}
      </ul>
    </details>
  )
}

export function DetalleMesaAdmin({ codigo, alCerrar }: DetalleMesaAdminProps) {
  const { mesa, cargandoMesas, cargandoCuentas } = useMesaDetalle(codigo)
  const areas = useAreas()
  const mostrarMesa = usePedidos((s) => s.mostrarMesa)
  const navegar = useNavigate()
  const [verVacias, setVerVacias] = useState(false)

  const abrirEnPedidos = () => {
    if (!mesa) return
    mostrarMesa(mesa.codigo, mesa.areaId)
    void navegar('/pedidos')
  }

  const area = areas.find((a) => a.id === mesa?.areaId)?.nombre
  const conConsumo = mesa?.cuentas.filter(tieneConsumo) ?? []
  const sinConsumo = (mesa?.cuentas.length ?? 0) - conConsumo.length

  return (
    <Modal
      open={codigo !== null}
      onClose={alCerrar}
      title={`Detalle de la mesa ${codigo ?? ''}`}
      className="max-w-md"
    >
      <div className="flex max-h-[85dvh] flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {cargandoMesas && (
            <p role="status" className="py-8 text-center text-sm text-muted">
              Cargando mesa...
            </p>
          )}
          {!cargandoMesas && !mesa && (
            <p role="alert" className="py-8 text-center text-sm text-muted">
              No se encontró la mesa.
            </p>
          )}

          {mesa && (
            <>
              <header className="pr-10">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-extrabold">Mesa {mesa.codigo}</h3>
                  <InsigniaEstado estado={mesa.estado} />
                </div>
                <p className="mt-0.5 text-sm text-muted">
                  {area ?? 'Sin área'} · Capacidad {mesa.capacidad} · Solo consulta
                </p>
              </header>

              {mesa.estado === 'libre' ? (
                <p className="rounded-xl bg-bg px-4 py-6 text-center text-sm text-muted">
                  Esta mesa está libre. No tiene cuentas ni consumo.
                </p>
              ) : (
                <>
                  <dl className="grid grid-cols-2 gap-2">
                    <Dato etiqueta="Mozo" valor={mesa.mozo ?? '—'} />
                    <Dato
                      etiqueta="Abierta hace"
                      valor={mesa.apertura ? tiempoCorto(mesa.apertura) : '—'}
                    />
                    <Dato etiqueta="Comensales" valor={String(mesa.comensales)} />
                    <Dato etiqueta="Consumo total" valor={formatoMoneda(mesa.consumo)} />
                  </dl>

                  <section aria-label="Cuentas" className="space-y-2">
                    <h4 className="text-sm font-bold">
                      Cuentas
                      <span className="ml-2 font-normal text-muted">
                        {mesa.numeroCuentas} en total
                        {!cargandoCuentas && ` · ${conConsumo.length} con consumo`}
                      </span>
                    </h4>

                    {cargandoCuentas && (
                      <p role="status" className="py-3 text-center text-sm text-muted">
                        Cargando cuentas...
                      </p>
                    )}
                    {!cargandoCuentas && conConsumo.length === 0 && (
                      <p className="rounded-xl bg-bg px-4 py-4 text-center text-sm text-muted">
                        Ninguna cuenta tiene consumo todavía.
                      </p>
                    )}
                    {conConsumo.map((cuenta) => (
                      <CuentaConsumo key={cuenta.numero} cuenta={cuenta} />
                    ))}

                    {sinConsumo > 0 && (
                      <>
                        <button
                          type="button"
                          aria-expanded={verVacias}
                          onClick={() => setVerVacias((v) => !v)}
                          className="w-full cursor-pointer rounded-xl py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
                        >
                          {verVacias
                            ? 'Ocultar cuentas sin consumo'
                            : `Ver ${sinConsumo} ${sinConsumo === 1 ? 'cuenta' : 'cuentas'} sin consumo`}
                        </button>
                        {verVacias && (
                          <ul className="flex flex-wrap gap-1.5">
                            {mesa.cuentas
                              .filter((c) => !tieneConsumo(c))
                              .map((c) => (
                                <li
                                  key={c.numero}
                                  className="rounded-lg bg-bg px-2.5 py-1 text-xs text-muted"
                                >
                                  {c.nombre}
                                </li>
                              ))}
                          </ul>
                        )}
                      </>
                    )}
                  </section>
                </>
              )}
            </>
          )}
        </div>

        {mesa && (
          <footer className="shrink-0 border-t border-line bg-surface p-4">
            <button
              type="button"
              onClick={abrirEnPedidos}
              className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-md shadow-primary/30 transition hover:brightness-110 active:scale-[0.98]"
            >
              <ExternalLink className="size-4" />
              Abrir en Pedidos
            </button>
            <p className="mt-2 text-center text-xs text-muted">
              Aquí solo se consulta. Para tomar pedidos o modificar la mesa, ábrela en Pedidos.
            </p>
          </footer>
        )}
      </div>
    </Modal>
  )
}
