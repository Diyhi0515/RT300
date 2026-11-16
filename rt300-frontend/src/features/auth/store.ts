import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { alNoAutorizado, tokens } from '@/lib/http'
import { queryClient } from '@/lib/queryClient'
import { notificar } from '@/shared/avisos/almacen'
import type { Perfil } from './types'

interface EstadoSesion {
  perfil: Perfil | null
  iniciar: (perfil: Perfil, access: string) => void
  cerrar: () => void
}

export const useSesion = create<EstadoSesion>()(
  persist(
    (set) => ({
      perfil: null,
      iniciar: (perfil, access) => {
        tokens.fijarAcceso(access)
        tokens.fijarSesionRenovable(true)
        set({ perfil })
      },
      cerrar: () => {
        tokens.limpiar()
        queryClient.clear()
        set({ perfil: null })
      },
    }),
    {
      name: 'rt300-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ perfil: state.perfil }),
    },
  ),
)

alNoAutorizado(() => {
  useSesion.getState().cerrar()
  notificar.advertencia('Tu sesión expiró. Inicia sesión nuevamente.', 'Sesión finalizada')
})
