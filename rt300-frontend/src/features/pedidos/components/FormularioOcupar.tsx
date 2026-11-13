import { useState } from 'react'
import { UserRound } from 'lucide-react'
import { useSesion } from '@/features/auth'
import { vibrar } from '@/lib/vibrar'
import { notificar } from '@/shared/avisos/almacen'
import { useOcuparMesa } from '../hooks'
import type { MesaPlano } from '../types'
import { Contador } from './Contador'

interface FormularioOcuparProps {
  mesa: MesaPlano
}

const MAXIMO_CUENTAS = 20

const primario =
  'flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-club-pc to-club-tertiary text-base font-bold text-white shadow-[0_10px_24px_rgba(43,83,184,.35)] transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 short:h-10 short:text-sm'

export function FormularioOcupar({ mesa }: FormularioOcuparProps) {
  const perfil = useSesion((s) => s.perfil)
  const ocupar = useOcuparMesa()
  const [comensales, setComensales] = useState(mesa.capacidad)
  const [cuentas, setCuentas] = useState(1)

  const ocuparMesa = async () => {
    try {
      await ocupar.mutateAsync({
        mesa: mesa.codigo,
        caco: Number(mesa.areaId),
        ccom: comensales,
        ncta: cuentas,
      })
    } catch {
      return
    }
    vibrar('exito')
    notificar.exito(
      `${comensales} ${comensales === 1 ? 'comensal' : 'comensales'} y ${cuentas} ${
        cuentas === 1 ? 'cuenta' : 'cuentas'
      }.`,
      `Mesa ${mesa.codigo} ocupada`,
    )
  }

  return (
    <div className="space-y-4 p-5 short:space-y-2 short:p-3">
      <h4 className="text-sm font-bold text-primary">Ocupar {mesa.codigo}</h4>
      <Contador
        etiqueta="Comensales"
        detalle={`Capacidad de ${mesa.capacidad}`}
        valor={comensales}
        minimo={1}
        maximo={Math.max(mesa.capacidad + 4, 12)}
        alCambiar={setComensales}
      />
      <Contador
        etiqueta="Cuentas"
        detalle="Una por cada persona o grupo que paga aparte"
        valor={cuentas}
        minimo={1}
        maximo={MAXIMO_CUENTAS}
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
      <button
        type="button"
        className={primario}
        disabled={ocupar.isPending}
        onClick={() => void ocuparMesa()}
      >
        {ocupar.isPending ? 'Ocupando...' : 'Ocupar mesa'}
      </button>
    </div>
  )
}
