import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ClaveModulo } from './modulos'

interface EstadoUltimoModulo {
  clave: ClaveModulo | null
  registrar: (clave: ClaveModulo) => void
}

export const useUltimoModulo = create<EstadoUltimoModulo>()(
  persist(
    (set, get) => ({
      clave: null,
      registrar: (clave) => {
        if (get().clave !== clave) set({ clave })
      },
    }),
    {
      name: 'rt300-ultimo-modulo',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (estado) => ({ clave: estado.clave }),
    },
  ),
)
