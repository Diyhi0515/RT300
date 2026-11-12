import { create } from 'zustand'

type Orientacion = 'vertical' | 'horizontal'

const RETRASOS_MS = [0, 120, 350, 700]

const medir = () => ({
  orientacion: (window.innerWidth > window.innerHeight ? 'horizontal' : 'vertical') as Orientacion,
  alto: window.innerHeight,
})

export const useOrientacion = create<{ orientacion: Orientacion; alto: number }>(() => medir())

const aplicar = () => {
  const { orientacion, alto } = medir()
  const raiz = document.documentElement
  raiz.dataset.orientacion = orientacion
  raiz.style.setProperty('--alto-app', `${alto}px`)
  useOrientacion.setState({ orientacion, alto })
}

const alGirar = () => RETRASOS_MS.forEach((retraso) => window.setTimeout(aplicar, retraso))

window.addEventListener('resize', aplicar)
window.addEventListener('orientationchange', alGirar)
window.visualViewport?.addEventListener('resize', aplicar)
screen.orientation?.addEventListener('change', alGirar)

aplicar()
