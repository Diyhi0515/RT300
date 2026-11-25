import { memo, useEffect, useRef, useState, type PointerEvent } from 'react'
import { type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { totalMesa } from '../calculos'
import type { MesaPlano as MesaPlanoTipo } from '../types'
import { estilosMesa } from './estilosMesa'
import { InfoMesaFlotante } from './InfoMesaFlotante'

interface MesaPlanoProps {
  mesa: MesaPlanoTipo
  seleccionada: boolean
  indice: number
  alElegir: (codigo: string) => void
}

const SILLAS_VISIBLES_MAXIMO = 12
const ANCHO_MESA = 66
const ANCHO_MAXIMO_SILLA = 12
const LARGO_SILLA = 4.5
const ESPERA_PULSACION_LARGA_MS = 450

interface InfoAbierta {
  ancla: DOMRect
  fija: boolean
}

const repartirSillas = (capacidad: number) => {
  const total = Math.max(1, Math.min(capacidad, SILLAS_VISIBLES_MAXIMO))
  const lateral = Math.floor(total / 6)
  const resto = total - lateral * 2
  const arriba = Math.ceil(resto / 2)
  const abajo = resto - arriba
  const ancho = Math.min(ANCHO_MAXIMO_SILLA, (ANCHO_MESA * 0.85) / Math.max(arriba, 1))
  return { total, arriba, abajo, lateral, ancho }
}

const sillasTomadas = (mesa: MesaPlanoTipo, total: number) => {
  if (mesa.estado !== 'ocupada' || mesa.capacidad <= 0) return 0
  return Math.min(total, Math.max(1, Math.round((mesa.comensales / mesa.capacidad) * total)))
}

export const MesaPlano = memo(function MesaPlano({
  mesa,
  seleccionada,
  indice,
  alElegir,
}: MesaPlanoProps) {
  const estilo = estilosMesa[mesa.estado]
  const Icono = estilo.icono
  const ocupada = mesa.estado === 'ocupada'
  const { total, arriba, abajo, lateral, ancho } = repartirSillas(mesa.capacidad)
  const tomadas = sillasTomadas(mesa, total)
  const vacia = ocupada ? 'bg-club-pc/15 ring-1 ring-inset ring-club-pc/35' : estilo.silla
  const [info, setInfo] = useState<InfoAbierta | null>(null)
  const temporizador = useRef<number | null>(null)
  const pulsacionLarga = useRef(false)

  const cancelarEspera = () => {
    if (temporizador.current !== null) window.clearTimeout(temporizador.current)
    temporizador.current = null
  }

  useEffect(() => cancelarEspera, [])

  const infoFija = info?.fija ?? false
  useEffect(() => {
    if (!infoFija) return
    const cerrar = () => setInfo(null)
    document.addEventListener('pointerdown', cerrar, true)
    document.addEventListener('scroll', cerrar, true)
    return () => {
      document.removeEventListener('pointerdown', cerrar, true)
      document.removeEventListener('scroll', cerrar, true)
    }
  }, [infoFija])

  const alEntrar = (evento: PointerEvent<HTMLButtonElement>) => {
    if (evento.pointerType !== 'mouse') return
    setInfo({ ancla: evento.currentTarget.getBoundingClientRect(), fija: false })
  }

  const alSalir = (evento: PointerEvent<HTMLButtonElement>) => {
    if (evento.pointerType === 'mouse') setInfo((actual) => (actual?.fija ? actual : null))
    cancelarEspera()
  }

  const alPulsar = (evento: PointerEvent<HTMLButtonElement>) => {
    if (evento.pointerType === 'mouse') return
    pulsacionLarga.current = false
    const boton = evento.currentTarget
    cancelarEspera()
    temporizador.current = window.setTimeout(() => {
      pulsacionLarga.current = true
      setInfo({ ancla: boton.getBoundingClientRect(), fija: true })
    }, ESPERA_PULSACION_LARGA_MS)
  }

  const alElegirMesa = () => {
    if (pulsacionLarga.current) {
      pulsacionLarga.current = false
      return
    }
    setInfo(null)
    alElegir(mesa.codigo)
  }

  const silla = (numero: number, horizontal: boolean) => (
    <span
      key={numero}
      style={
        horizontal
          ? { width: `${ancho}cqw`, height: `${LARGO_SILLA}cqw` }
          : { width: `${LARGO_SILLA}cqw`, height: `${ancho}cqw` }
      }
      className={`rounded-md shadow-sm transition-colors duration-300 ${
        numero < tomadas ? estilo.silla : vacia
      }`}
    />
  )

  const inicioAbajo = arriba
  const inicioIzquierda = arriba + abajo
  const inicioDerecha = arriba + abajo + lateral

  return (
    <button
      type="button"
      onClick={alElegirMesa}
      onPointerEnter={alEntrar}
      onPointerLeave={alSalir}
      onPointerDown={alPulsar}
      onPointerUp={cancelarEspera}
      onPointerCancel={cancelarEspera}
      onContextMenu={(evento) => evento.preventDefault()}
      aria-pressed={seleccionada}
      aria-label={`Mesa ${mesa.codigo}, ${estilo.etiqueta}, ${mesa.capacidad} personas`}
      style={{ animationDelay: `${Math.min(indice, 8) * 15}ms` }}
      className="@container group relative aspect-square animate-[chip-in_0.16s_ease-out_both] cursor-pointer rounded-3xl p-1 transition duration-150 hover:-translate-y-1 active:scale-95"
    >
      {seleccionada && (
        <motion.span
          layoutId="mesa-seleccionada"
          aria-hidden
          transition={{ type: 'spring', stiffness: 700, damping: 46 }}
          className="absolute inset-0 rounded-3xl bg-primary/10 shadow-[0_10px_26px_rgba(43,83,184,.28)] ring-2 ring-primary"
        />
      )}
      <span aria-hidden className="absolute inset-x-[17%] top-[10%] flex justify-evenly">
        {Array.from({ length: arriba }, (_, i) => silla(i, true))}
      </span>
      <span aria-hidden className="absolute inset-x-[17%] bottom-[10%] flex justify-evenly">
        {Array.from({ length: abajo }, (_, i) => silla(inicioAbajo + i, true))}
      </span>
      {lateral > 0 && (
        <>
          <span
            aria-hidden
            className="absolute inset-y-[30%] left-[8%] flex flex-col justify-evenly"
          >
            {Array.from({ length: lateral }, (_, i) => silla(inicioIzquierda + i, false))}
          </span>
          <span
            aria-hidden
            className="absolute inset-y-[30%] right-[8%] flex flex-col justify-evenly"
          >
            {Array.from({ length: lateral }, (_, i) => silla(inicioDerecha + i, false))}
          </span>
        </>
      )}
      <span
        className={`absolute inset-x-[17%] inset-y-[24%] flex flex-col items-center justify-center rounded-2xl border-2 transition-colors duration-300 ${estilo.cuerpo} ${
          ocupada ? 'shadow-[0_10px_24px_rgba(43,83,184,.4)]' : 'shadow-md shadow-success/15'
        }`}
      >
        <Contenido mesa={mesa} Icono={Icono} ocupada={ocupada} />
      </span>
      {info && <InfoMesaFlotante mesa={mesa} ancla={info.ancla} />}
    </button>
  )
})

interface ContenidoProps {
  mesa: MesaPlanoTipo
  Icono: LucideIcon
  ocupada: boolean
}

function Contenido({ mesa, Icono, ocupada }: ContenidoProps) {
  return (
    <>
      <strong className="text-[17cqw] font-extrabold leading-none">{mesa.codigo.slice(-2)}</strong>
      {ocupada ? (
        <span className="mt-[1.5cqw] text-[9cqw] font-bold tabular-nums">
          Bs {Math.round(totalMesa(mesa))}
        </span>
      ) : (
        <span className="mt-[1.5cqw] flex items-center gap-[1.2cqw] text-[9.5cqw] font-semibold opacity-90">
          <Icono className="size-[1.1em]" />
          {mesa.capacidad}
        </span>
      )}
    </>
  )
}
