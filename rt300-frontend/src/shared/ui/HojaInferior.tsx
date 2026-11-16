import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface HojaInferiorProps {
  abierta: boolean
  alCerrar: () => void
  titulo: string
  children: ReactNode
}

const DURACION_MS = 180
const DISTANCIA_CIERRE = 120
const VELOCIDAD_CIERRE = 0.5
const DISTANCIA_MINIMA_VELOCIDAD = 40

export function HojaInferior({ abierta, alCerrar, titulo, children }: HojaInferiorProps) {
  const idTitulo = useId()
  const hoja = useRef<HTMLElement>(null)
  const arrastreInicial = useRef<{ y: number; instante: number } | null>(null)
  const temporizador = useRef<number | null>(null)
  const [desplazamiento, setDesplazamiento] = useState(0)
  const [animando, setAnimando] = useState(false)
  const [saliendo, setSaliendo] = useState(false)
  const [alto, setAlto] = useState(1)

  useEffect(
    () => () => {
      if (temporizador.current !== null) window.clearTimeout(temporizador.current)
    },
    [],
  )

  const cerrarAnimado = useCallback(() => {
    if (saliendo) return
    setSaliendo(true)
    setAnimando(true)
    const altura = hoja.current?.offsetHeight ?? window.innerHeight
    setAlto(altura)
    setDesplazamiento(altura)
    temporizador.current = window.setTimeout(() => {
      alCerrar()
      setSaliendo(false)
      setAnimando(false)
      setDesplazamiento(0)
    }, DURACION_MS)
  }, [saliendo, alCerrar])

  useEffect(() => {
    if (!abierta) return
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') cerrarAnimado()
    }
    window.addEventListener('keydown', alTeclear)
    return () => {
      document.body.style.overflow = previo
      window.removeEventListener('keydown', alTeclear)
    }
  }, [abierta, cerrarAnimado])

  if (!abierta) return null

  const opacidadFondo = 1 - Math.min(1, desplazamiento / alto)

  const alEmpezar = (evento: React.PointerEvent<HTMLDivElement>) => {
    if (saliendo) return
    evento.currentTarget.setPointerCapture(evento.pointerId)
    setAlto(hoja.current?.offsetHeight ?? 1)
    arrastreInicial.current = { y: evento.clientY, instante: performance.now() }
    setAnimando(false)
  }

  const alMover = (evento: React.PointerEvent<HTMLDivElement>) => {
    const inicio = arrastreInicial.current
    if (!inicio) return
    setDesplazamiento(Math.max(0, evento.clientY - inicio.y))
  }

  const alSoltar = (evento: React.PointerEvent<HTMLDivElement>) => {
    const inicio = arrastreInicial.current
    if (!inicio) return
    arrastreInicial.current = null
    const distancia = Math.max(0, evento.clientY - inicio.y)
    const velocidad = distancia / Math.max(1, performance.now() - inicio.instante)
    if (
      distancia > DISTANCIA_CIERRE ||
      (velocidad > VELOCIDAD_CIERRE && distancia > DISTANCIA_MINIMA_VELOCIDAD)
    ) {
      cerrarAnimado()
      return
    }
    setAnimando(true)
    setDesplazamiento(0)
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end">
      <div
        aria-hidden
        style={{
          opacity: opacidadFondo,
          transition: animando ? `opacity ${DURACION_MS}ms ease-out` : 'none',
        }}
        className="absolute inset-0 animate-[fade_0.15s_ease-out] bg-black/55 escritorio:backdrop-blur-sm"
      />
      <button
        type="button"
        aria-label="Cerrar"
        tabIndex={-1}
        onClick={cerrarAnimado}
        className="absolute inset-0 cursor-default"
      />
      <section
        ref={hoja}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        style={{
          transform: desplazamiento ? `translateY(${desplazamiento}px)` : undefined,
          transition: animando ? `transform ${DURACION_MS}ms ease-out` : 'none',
        }}
        className="relative mx-auto flex max-h-[88dvh] w-full max-w-lg animate-[subir_0.22s_cubic-bezier(0.2,0.9,0.3,1)] flex-col overflow-hidden rounded-t-[28px] border-t border-line bg-surface text-fg shadow-[0_-24px_70px_rgba(1,21,38,.35)]"
      >
        <div
          onPointerDown={alEmpezar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
          className="relative flex h-9 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
        >
          <span className="h-1.5 w-11 rounded-full bg-line" aria-hidden />
          <h2 id={idTitulo} className="sr-only">
            {titulo}
          </h2>
        </div>
        <button
          type="button"
          onClick={cerrarAnimado}
          aria-label="Cerrar"
          className="absolute right-3 top-2 z-20 grid size-10 cursor-pointer place-items-center rounded-xl text-muted transition hover:bg-primary/10 hover:text-fg active:scale-95"
        >
          <X className="size-5" />
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
          {children}
        </div>
      </section>
    </div>,
    document.body,
  )
}
