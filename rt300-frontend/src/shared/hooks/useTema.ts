import { create } from 'zustand'

type Tema = 'light' | 'dark'

const CLAVE_TEMA = 'rt300-theme'

const COLOR_BARRA: Record<Tema, string> = { light: '#0a1a3d', dark: '#050a14' }

const guardado = (): Tema | null => {
  try {
    const saved = localStorage.getItem(CLAVE_TEMA)
    return saved === 'light' || saved === 'dark' ? saved : null
  } catch {
    return null
  }
}

const sistema = (): Tema => (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

const aplicar = (theme: Tema) => {
  const raiz = document.documentElement
  raiz.classList.add('tema-cambiando')
  raiz.classList.toggle('dark', theme === 'dark')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLOR_BARRA[theme])
  window.setTimeout(() => raiz.classList.remove('tema-cambiando'), 150)
}

interface EstadoTema {
  theme: Tema
  toggle: () => void
}

export const useTema = create<EstadoTema>((set, get) => ({
  theme: guardado() ?? sistema(),
  toggle: () => {
    const next: Tema = get().theme === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem(CLAVE_TEMA, next)
    } catch {
      void 0
    }
    aplicar(next)
    set({ theme: next })
  },
}))

const sincronizar = () => {
  const next = guardado() ?? sistema()
  if (next === useTema.getState().theme) return
  aplicar(next)
  useTema.setState({ theme: next })
}

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', sincronizar)
window.addEventListener('storage', (event) => {
  if (event.key === CLAVE_TEMA) sincronizar()
})

aplicar(useTema.getState().theme)
