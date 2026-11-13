import { Clock, type LucideIcon } from 'lucide-react'
import { tiempoCorto, totalMesa } from '../calculos'
import type { MesaPlano as MesaPlanoTipo } from '../types'
import { estilosMesa } from './estilosMesa'

interface MesaPlanoProps {
  mesa: MesaPlanoTipo
  seleccionada: boolean
  indice: number
  alElegir: (codigo: string) => void
}

const sillasRedondas = (capacidad: number) =>
  Array.from({ length: capacidad }, (_, i) => (360 / capacidad) * i)

const sillasLargas = (capacidad: number) => {
  const arriba = Math.ceil(capacidad / 2)
  const abajo = capacidad - arriba
  return { arriba, abajo }
}

export function MesaPlano({ mesa, seleccionada, indice, alElegir }: MesaPlanoProps) {
  const estilo = estilosMesa[mesa.estado]
  const Icono = estilo.icono
  const ocupada = mesa.estado === 'ocupada'
  const larga = mesa.forma === 'larga'

  return (
    <button
      type="button"
      onClick={() => alElegir(mesa.codigo)}
      aria-pressed={seleccionada}
      aria-label={`Mesa ${mesa.codigo}, ${estilo.etiqueta}, ${mesa.capacidad} personas`}
      style={{ animationDelay: `${Math.min(indice, 20) * 28}ms` }}
      className={`@container group relative animate-[chip-in_0.4s_ease-out_both] cursor-pointer rounded-3xl p-1 transition duration-200 hover:-translate-y-0.5 active:scale-95 ${
        larga ? 'col-span-2 aspect-[2/1]' : 'aspect-square'
      } ${seleccionada ? 'z-10 scale-[1.04] bg-primary/10 ring-2 ring-primary' : ''}`}
    >
      {larga ? (
        <>
          <span className="absolute inset-x-[12%] top-[4%] flex justify-between" aria-hidden>
            {Array.from({ length: sillasLargas(mesa.capacidad).arriba }, (_, i) => (
              <span
                key={i}
                className={`h-[8cqw] w-[10cqw] rounded-md transition ${estilo.silla}`}
              />
            ))}
          </span>
          <span className="absolute inset-x-[12%] bottom-[4%] flex justify-around" aria-hidden>
            {Array.from({ length: sillasLargas(mesa.capacidad).abajo }, (_, i) => (
              <span
                key={i}
                className={`h-[8cqw] w-[10cqw] rounded-md transition ${estilo.silla}`}
              />
            ))}
          </span>
          <span
            className={`absolute inset-x-[7%] inset-y-[22%] flex flex-col items-center justify-center rounded-[18cqw] border-2 transition duration-300 ${estilo.cuerpo}`}
          >
            <Contenido mesa={mesa} Icono={Icono} ocupada={ocupada} ancho />
          </span>
        </>
      ) : (
        <>
          <span className="absolute inset-0" aria-hidden>
            {sillasRedondas(mesa.capacidad).map((angulo) => (
              <span
                key={angulo}
                style={{
                  transform: `rotate(${angulo}deg) translateY(-41cqw)`,
                }}
                className={`absolute left-1/2 top-1/2 -ml-[10cqw] -mt-[4.5cqw] h-[9cqw] w-[20cqw] rounded-md transition ${estilo.silla}`}
              />
            ))}
          </span>
          <span
            className={`absolute inset-[19%] flex flex-col items-center justify-center rounded-full border-2 transition duration-300 ${estilo.cuerpo}`}
          >
            <Contenido mesa={mesa} Icono={Icono} ocupada={ocupada} />
          </span>
        </>
      )}
      {ocupada && mesa.apertura && (
        <span className="sr-only">Abierta hace {tiempoCorto(mesa.apertura)}</span>
      )}
    </button>
  )
}

interface ContenidoProps {
  mesa: MesaPlanoTipo
  Icono: LucideIcon
  ocupada: boolean
  ancho?: boolean
}

function Contenido({ mesa, Icono, ocupada, ancho = false }: ContenidoProps) {
  return (
    <>
      <strong className={`${ancho ? 'text-[7cqw]' : 'text-[15cqw]'} font-extrabold leading-none`}>
        {mesa.codigo.slice(-2)}
      </strong>
      <span
        className={`mt-[1.5cqw] flex items-center gap-[1.2cqw] ${ancho ? 'text-[4.4cqw]' : 'text-[9.5cqw]'} font-semibold opacity-90`}
      >
        {ocupada ? (
          <>
            <Clock className="size-[1.1em]" />
            {mesa.apertura ? tiempoCorto(mesa.apertura) : ''}
          </>
        ) : (
          <>
            <Icono className="size-[1.1em]" />
            {mesa.capacidad}
          </>
        )}
      </span>
      {ocupada && (
        <span className={`${ancho ? 'text-[4cqw]' : 'text-[8.5cqw]'} font-bold tabular-nums`}>
          Bs {Math.round(totalMesa(mesa))}
        </span>
      )}
    </>
  )
}
