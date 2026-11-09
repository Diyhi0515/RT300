import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export const MAX_INTENTOS = 5
export const BLOQUEO_MS = 5 * 60 * 1000
export const VENTANA_REINICIO_MS = 60 * 1000

const CLAVE_ALMACEN = 'rt300-login-lock'

interface Registro {
  intentos: number
  bloqueadoHasta: number | null
  ultimoFallo?: number
}

interface ResultadoFallo {
  bloqueado: boolean
  restantes: number
}

interface EstadoBloqueo {
  usuarios: Record<string, Registro>
  registrarFallo: (usuario: string) => ResultadoFallo
  reiniciar: (usuario?: string) => void
}

const normalizar = (usuario: string) => usuario.trim().toUpperCase()

const vigente = (registro: Registro | undefined): Registro => {
  if (!registro) return { intentos: 0, bloqueadoHasta: null }
  if (registro.bloqueadoHasta && registro.bloqueadoHasta <= Date.now()) {
    return { intentos: 0, bloqueadoHasta: null }
  }
  if (!registro.bloqueadoHasta && Date.now() - (registro.ultimoFallo ?? 0) > VENTANA_REINICIO_MS) {
    return { intentos: 0, bloqueadoHasta: null }
  }
  return registro
}

export const useAlmacenBloqueo = create<EstadoBloqueo>()(
  persist(
    (set, get) => ({
      usuarios: {},
      registrarFallo: (usuario) => {
        const clave = normalizar(usuario)
        const intentos = vigente(get().usuarios[clave]).intentos + 1
        const bloqueado = intentos >= MAX_INTENTOS
        const registro: Registro = {
          intentos,
          bloqueadoHasta: bloqueado ? Date.now() + BLOQUEO_MS : null,
          ultimoFallo: Date.now(),
        }
        set((s) => ({ usuarios: { ...s.usuarios, [clave]: registro } }))
        return { bloqueado, restantes: Math.max(0, MAX_INTENTOS - intentos) }
      },
      reiniciar: (usuario) =>
        set((s) => {
          if (!usuario) return { usuarios: {} }
          const siguiente = { ...s.usuarios }
          delete siguiente[normalizar(usuario)]
          return { usuarios: siguiente }
        }),
    }),
    {
      name: CLAVE_ALMACEN,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: () => ({ usuarios: {} }),
      partialize: (state) => ({ usuarios: state.usuarios }),
    },
  ),
)

window.addEventListener('storage', (event) => {
  if (event.key === CLAVE_ALMACEN) void useAlmacenBloqueo.persist.rehydrate()
})
