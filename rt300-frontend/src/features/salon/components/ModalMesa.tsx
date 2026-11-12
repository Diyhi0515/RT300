import { useState } from 'react'
import { Armchair, Clock, Minus, Plus, UserRound, Users } from 'lucide-react'
import { useSesion } from '@/features/auth'
import { notificar } from '@/shared/avisos/almacen'
import { Modal } from '@/shared/ui/Modal'
import { formatoMoneda, tiempoTranscurrido } from '../formato'
import { useSalon } from '../store'
import type { Mesa } from '../types'
import { InsigniaEstado } from './InsigniaEstado'

interface ModalMesaProps {
  mesa: Mesa | null
  alCerrar: () => void
}

const botonPrimario =
  'flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-primary text-base font-bold text-white shadow-lg shadow-primary/30 transition hover:brightness-110 active:scale-[0.98] short:h-10 short:text-sm'

const botonSecundario =
  'flex h-12 w-full cursor-pointer items-center justify-center rounded-xl border border-line text-base font-semibold text-fg transition hover:bg-primary/5 active:scale-[0.98] short:h-10 short:text-sm'

const botonPeligro =
  'flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-danger text-base font-bold text-white shadow-lg shadow-danger/25 transition hover:brightness-110 active:scale-[0.98] short:h-10 short:text-sm'

interface DetalleProps {
  mesa: Mesa
  alCerrar: () => void
}

function Detalle({ mesa, alCerrar }: DetalleProps) {
  const perfil = useSesion((s) => s.perfil)
  const pedidos = useSalon((s) => s.pedidos)
  const { ocupar, liberar, reservar, habilitar } = useSalon.getState()
  const [comensales, setComensales] = useState(Math.min(2, mesa.capacidad))

  const abiertos = pedidos.filter((p) => p.mesa === mesa.numero && p.estado !== 'cobrado')
  const consumo = abiertos.reduce((suma, p) => suma + p.total, 0)

  const accion = (fn: () => void, mensaje: string) => {
    fn()
    notificar.exito(mensaje, `Mesa ${mesa.numero}`)
    alCerrar()
  }

  return (
    <div className="space-y-5 px-6 pb-6 pt-8 short:space-y-3 short:px-5 short:pb-4 short:pt-4">
      <div className="flex items-center gap-3 pr-10">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary short:size-11">
          <Armchair className="size-7 short:size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-xl font-bold tracking-tight">Mesa {mesa.numero}</h3>
          <p className="text-sm text-muted">
            {mesa.zona} · {mesa.capacidad} personas
          </p>
        </div>
      </div>

      <InsigniaEstado estado={mesa.estado} />

      {mesa.estado === 'ocupada' && (
        <>
          <dl className="grid grid-cols-3 gap-2 text-center">
            {[
              { icono: Users, etiqueta: 'Comensales', valor: String(mesa.comensales) },
              {
                icono: Clock,
                etiqueta: 'Abierta',
                valor: mesa.apertura ? tiempoTranscurrido(mesa.apertura) : '-',
              },
              { icono: UserRound, etiqueta: 'Garzón', valor: mesa.garzon ?? '-' },
            ].map(({ icono: Icono, etiqueta, valor }) => (
              <div key={etiqueta} className="rounded-xl bg-bg px-2 py-3 short:py-2">
                <Icono className="mx-auto mb-1 size-4 text-primary" />
                <dt className="text-[11px] text-muted">{etiqueta}</dt>
                <dd className="truncate text-sm font-bold">{valor}</dd>
              </div>
            ))}
          </dl>
          <div className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3 short:py-2">
            <span className="text-sm font-semibold text-muted">Consumo abierto</span>
            <strong className="text-lg tabular-nums text-primary">{formatoMoneda(consumo)}</strong>
          </div>
          <button
            type="button"
            className={botonPeligro}
            onClick={() => accion(() => liberar(mesa.numero), 'Mesa liberada y cuenta cerrada.')}
          >
            Liberar mesa
          </button>
        </>
      )}

      {mesa.estado !== 'ocupada' && (
        <>
          <div className="flex items-center justify-between rounded-xl bg-bg px-4 py-3 short:py-2">
            <span className="text-sm font-semibold">Comensales</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Menos comensales"
                disabled={comensales <= 1}
                onClick={() => setComensales((v) => v - 1)}
                className="grid size-10 cursor-pointer place-items-center rounded-lg border border-line transition hover:bg-primary/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 short:size-9"
              >
                <Minus className="size-4" />
              </button>
              <strong className="w-6 text-center text-lg tabular-nums">{comensales}</strong>
              <button
                type="button"
                aria-label="Más comensales"
                disabled={comensales >= mesa.capacidad}
                onClick={() => setComensales((v) => v + 1)}
                className="grid size-10 cursor-pointer place-items-center rounded-lg border border-line transition hover:bg-primary/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 short:size-9"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
          <div className="grid gap-2">
            <button
              type="button"
              className={botonPrimario}
              onClick={() =>
                accion(
                  () => ocupar(mesa.numero, comensales, perfil?.usuario ?? 'GP1'),
                  `Mesa ocupada con ${comensales} ${comensales === 1 ? 'comensal' : 'comensales'}.`,
                )
              }
            >
              Ocupar mesa
            </button>
            {mesa.estado === 'libre' ? (
              <button
                type="button"
                className={botonSecundario}
                onClick={() => accion(() => reservar(mesa.numero), 'Mesa reservada.')}
              >
                Reservar
              </button>
            ) : (
              <button
                type="button"
                className={botonSecundario}
                onClick={() => accion(() => habilitar(mesa.numero), 'Mesa habilitada.')}
              >
                Habilitar mesa
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function ModalMesa({ mesa, alCerrar }: ModalMesaProps) {
  const actual = useSalon((s) => s.mesas.find((m) => m.numero === mesa?.numero) ?? null)
  return (
    <Modal open={!!mesa && !!actual} onClose={alCerrar} title={`Mesa ${mesa?.numero ?? ''}`}>
      {actual && (
        <Detalle key={`${actual.numero}-${actual.estado}`} mesa={actual} alCerrar={alCerrar} />
      )}
    </Modal>
  )
}
