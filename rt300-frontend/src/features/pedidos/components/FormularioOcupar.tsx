import { useState } from 'react'
import { UserRound } from 'lucide-react'
import { useSesion } from '@/features/auth'
import { vibrar } from '@/lib/vibrar'
import { notificar } from '@/shared/avisos/almacen'
import { usePedidos } from '../store'
import type { MesaPlano } from '../types'
import { Contador } from './Contador'

interface FormularioOcuparProps {
  mesa: MesaPlano
}

const primario =
  'flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-club-pc to-club-tertiary text-base font-bold text-white shadow-[0_10px_24px_rgba(43,83,184,.35)] transition hover:brightness-110 active:scale-[0.98] short:h-10 short:text-sm'

const secundario =
  'flex h-12 w-full cursor-pointer items-center justify-center rounded-xl border border-line text-base font-semibold transition hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98] short:h-10 short:text-sm'

export function FormularioOcupar({ mesa }: FormularioOcuparProps) {
  const perfil = useSesion((s) => s.perfil)
  const { ocupar, reservar, habilitar } = usePedidos.getState()
  const [comensales, setComensales] = useState(mesa.capacidad)
  const [cuentas, setCuentas] = useState(1)

  const cambiarComensales = (valor: number) => {
    setComensales(valor)
    if (cuentas > valor) setCuentas(valor)
  }

  const ocuparMesa = () => {
    ocupar(mesa.codigo, comensales, cuentas, perfil?.usuario ?? 'GP1')
    vibrar('exito')
    notificar.exito(
      `${comensales} ${comensales === 1 ? 'comensal' : 'comensales'} y ${cuentas} ${
        cuentas === 1 ? 'cuenta' : 'cuentas'
      }.`,
      `Mesa ${mesa.codigo} ocupada`,
    )
  }

  const reservada = mesa.estado === 'reservada'

  return (
    <div className="space-y-4 p-5 short:space-y-2 short:p-3">
      <h4 className="text-sm font-bold text-primary">Ocupar {mesa.codigo}</h4>
      <Contador
        etiqueta="Comensales"
        detalle={`Capacidad de ${mesa.capacidad}`}
        valor={comensales}
        minimo={1}
        maximo={Math.max(mesa.capacidad + 4, 12)}
        alCambiar={cambiarComensales}
      />
      <Contador
        etiqueta="Cuentas"
        detalle="No pueden superar a los comensales"
        valor={cuentas}
        minimo={1}
        maximo={comensales}
        alCambiar={setCuentas}
      />
      <div className="flex items-center gap-3 rounded-2xl border border-line px-4 py-3 short:py-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <UserRound className="size-[18px]" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] text-muted">Atiende</p>
          <p className="truncate text-sm font-bold">{perfil?.nombre || perfil?.usuario}</p>
        </div>
      </div>
      <div className="grid gap-2">
        <button type="button" className={primario} onClick={ocuparMesa}>
          Ocupar mesa
        </button>
        {reservada ? (
          <button
            type="button"
            className={secundario}
            onClick={() => {
              habilitar(mesa.codigo)
              notificar.exito('La reserva se canceló.', `Mesa ${mesa.codigo} habilitada`)
            }}
          >
            Habilitar mesa
          </button>
        ) : (
          <button
            type="button"
            className={secundario}
            onClick={() => {
              reservar(mesa.codigo)
              notificar.exito(
                'Quedó apartada para sus comensales.',
                `Mesa ${mesa.codigo} reservada`,
              )
            }}
          >
            Reservar
          </button>
        )}
      </div>
    </div>
  )
}
