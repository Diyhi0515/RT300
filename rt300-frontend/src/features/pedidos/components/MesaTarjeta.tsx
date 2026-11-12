import { Armchair, Clock, Users } from 'lucide-react'
import { formatoMonedaEntera } from '@/features/salon/formato'
import { tiempoCorto, totalMesa } from '../calculos'
import type { EstadoMesaPlano, MesaPlano } from '../types'

interface MesaTarjetaProps {
  mesa: MesaPlano
  seleccionada: boolean
  indice: number
  alElegir: (codigo: string) => void
}

const ESTILO: Record<
  EstadoMesaPlano,
  { etiqueta: string; fondo: string; numero: string; insignia: string }
> = {
  libre: {
    etiqueta: 'Libre',
    fondo: 'border-success/35 bg-success/10 hover:border-success/70',
    numero: 'text-success',
    insignia: 'bg-success text-white dark:text-[#04140f]',
  },
  ocupada: {
    etiqueta: 'Ocupada',
    fondo: 'border-club-pc/40 bg-club-pc/10 hover:border-club-pc/80',
    numero: 'text-fg',
    insignia: 'bg-club-pc text-white',
  },
  cobro: {
    etiqueta: 'Por cobrar',
    fondo: 'border-accent-solid/55 bg-accent-solid/12 hover:border-accent-solid',
    numero: 'text-fg',
    insignia: 'bg-accent-solid text-[#2a1a00]',
  },
  reservada: {
    etiqueta: 'Reservada',
    fondo:
      'border-dashed border-club-secondary/60 bg-club-secondary/10 hover:border-club-secondary',
    numero: 'text-club-secondary',
    insignia: 'bg-club-secondary text-white dark:text-[#071226]',
  },
}

export function MesaTarjeta({ mesa, seleccionada, indice, alElegir }: MesaTarjetaProps) {
  const estilo = ESTILO[mesa.estado]
  const ocupada = mesa.estado === 'ocupada' || mesa.estado === 'cobro'

  return (
    <button
      type="button"
      onClick={() => alElegir(mesa.codigo)}
      aria-pressed={seleccionada}
      aria-label={`Mesa ${mesa.codigo}, ${estilo.etiqueta}, ${mesa.capacidad} sillas`}
      style={{ animationDelay: `${Math.min(indice, 20) * 25}ms` }}
      className={`flex min-h-[112px] animate-[chip-in_0.35s_ease-out_both] cursor-pointer flex-col justify-between rounded-2xl border-2 p-3.5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97] short:min-h-[92px] short:p-2.5 ${
        seleccionada
          ? 'border-primary bg-primary/10 shadow-[0_10px_26px_rgba(43,83,184,.28)]'
          : estilo.fondo
      }`}
    >
      <span className="flex items-start justify-between gap-1.5">
        <strong
          className={`text-3xl font-extrabold leading-none tracking-tight tabular-nums short:text-2xl ${estilo.numero}`}
        >
          {mesa.codigo.slice(-2)}
        </strong>
        <span className="flex flex-wrap justify-end gap-1">
          {seleccionada && (
            <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
              Activa
            </span>
          )}
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${estilo.insignia}`}
          >
            {estilo.etiqueta}
          </span>
        </span>
      </span>

      {ocupada ? (
        <span className="mt-3 block space-y-1 short:mt-1.5">
          <span className="flex items-center gap-1 text-xs text-muted">
            <Users className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {mesa.comensales} {mesa.comensales === 1 ? 'comensal' : 'comensales'}
            </span>
          </span>
          <span className="flex items-center justify-between gap-2">
            <strong className="truncate text-sm font-extrabold tabular-nums text-fg">
              {formatoMonedaEntera(totalMesa(mesa))}
            </strong>
            <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-bold tabular-nums text-primary">
              <Clock className="size-3.5 shrink-0" aria-hidden />
              {mesa.apertura ? tiempoCorto(mesa.apertura) : ''}
            </span>
          </span>
        </span>
      ) : (
        <span className="mt-3 flex items-center justify-between gap-2 text-xs text-muted short:mt-1.5">
          <span className="flex items-center gap-1.5">
            <Armchair className="size-4 shrink-0" aria-hidden />
            {mesa.capacidad} {mesa.capacidad === 1 ? 'silla' : 'sillas'}
          </span>
          <span className="font-semibold tracking-wide">{mesa.codigo}</span>
        </span>
      )}
    </button>
  )
}
