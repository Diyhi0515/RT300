import { useCallback, useEffect, useId, useRef, type PointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { bloquearScroll } from './bloquearScroll'

interface HojaInferiorProps {
  abierta: boolean
  alCerrar: () => void
  titulo: string
  children: ReactNode
}

const DURACION_MS = 160
const CURVA = 'cubic-bezier(0.22, 1, 0.36, 1)'
const DISTANCIA_CIERRE = 100
const VELOCIDAD_CIERRE = 0.45
const DISTANCIA_MINIMA_VELOCIDAD = 30

interface Arrastre {
  y: number
  instante: number
  alto: number
}

export function HojaInferior({ abierta, alCerrar, titulo, children }: HojaInferiorProps) {
  const idTitulo = useId()
  const hoja = useRef<HTMLElement>(null)
  const fondo = useRef<HTMLDivElement>(null)
  const arrastre = useRef<Arrastre | null>(null)
  const temporizador = useRef<number | null>(null)
  const saliendo = useRef(false)

  useEffect(
    () => () => {
      if (temporizador.current !== null) window.clearTimeout(temporizador.current)
    },
    [],
  )

  const mover = (desplazamiento: number, alto: number, transicion: boolean) => {
    const panel = hoja.current
    const velo = fondo.current
    if (!panel || !velo) return
    const duracion = transicion ? `${DURACION_MS}ms` : '0ms'
    panel.style.transition = `transform ${duracion} ${CURVA}`
    velo.style.transition = `opacity ${duracion} ease-out`
    panel.style.transform = desplazamiento ? `translate3d(0, ${desplazamiento}px, 0)` : ''
    velo.style.opacity = desplazamiento ? String(1 - Math.min(1, desplazamiento / alto)) : ''
  }

  const cerrarAnimado = useCallback(() => {
    if (saliendo.current) return
    saliendo.current = true
    const alto = hoja.current?.offsetHeight ?? window.innerHeight
    mover(alto, alto, true)
    temporizador.current = window.setTimeout(() => {
      saliendo.current = false
      alCerrar()
    }, DURACION_MS)
  }, [alCerrar])

  useEffect(() => {
    if (!abierta) return
    const liberar = bloquearScroll()
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') cerrarAnimado()
    }
    window.addEventListener('keydown', alTeclear)
    return () => {
      liberar()
      window.removeEventListener('keydown', alTeclear)
    }
  }, [abierta, cerrarAnimado])

  if (!abierta) return null

  const alEmpezar = (evento: PointerEvent<HTMLDivElement>) => {
    if (saliendo.current) return
    evento.currentTarget.setPointerCapture(evento.pointerId)
    const alto = hoja.current?.offsetHeight ?? 1
    arrastre.current = { y: evento.clientY, instante: performance.now(), alto }
    if (hoja.current) hoja.current.style.willChange = 'transform'
  }

  const alMover = (evento: PointerEvent<HTMLDivElement>) => {
    const inicio = arrastre.current
    if (!inicio) return
    mover(Math.max(0, evento.clientY - inicio.y), inicio.alto, false)
  }

  const alSoltar = (evento: PointerEvent<HTMLDivElement>) => {
    const inicio = arrastre.current
    if (!inicio) return
    arrastre.current = null
    if (hoja.current) hoja.current.style.willChange = ''
    const distancia = Math.max(0, evento.clientY - inicio.y)
    const velocidad = distancia / Math.max(1, performance.now() - inicio.instante)
    if (
      distancia > DISTANCIA_CIERRE ||
      (velocidad > VELOCIDAD_CIERRE && distancia > DISTANCIA_MINIMA_VELOCIDAD)
    ) {
      cerrarAnimado()
      return
    }
    mover(0, inicio.alto, true)
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end">
      <div
        ref={fondo}
        aria-hidden
        className="absolute inset-0 animate-[fade_0.12s_ease-out] bg-black/55"
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
        className="relative mx-auto flex max-h-[88dvh] w-full max-w-lg animate-[subir_0.18s_cubic-bezier(0.22,1,0.36,1)] flex-col overflow-hidden rounded-t-[28px] border-t border-line bg-surface text-fg shadow-[0_-12px_36px_rgba(1,21,38,.28)]"
      >
        <div
          onPointerDown={alEmpezar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
          className="relative flex h-12 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
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
