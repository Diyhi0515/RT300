import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { http } from '@/lib/http'

export const MAXIMO_NOMBRE_NEGOCIO = 60

const esquemaAjusteNombre = z.object({
  nombre: z.string().nullish(),
  nombre_base: z.string().nullish(),
  personalizado: z.boolean(),
})

const CLAVE = ['negocio', 'ajustes']

export const useAjusteNombre = () =>
  useQuery({
    queryKey: CLAVE,
    queryFn: async () => esquemaAjusteNombre.parse((await http.get('/negocio/ajustes')).data),
  })

/** Un nombre vacío vuelve a usar el de la base de datos. */
export const useCambiarNombre = () => {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: async (nombre: string) =>
      esquemaAjusteNombre.parse((await http.put('/negocio/ajustes', { nombre })).data),
    // invalida también ['negocio'], que es lo que muestra la pantalla de ingreso
    onSuccess: () => cliente.invalidateQueries({ queryKey: ['negocio'] }),
  })
}
