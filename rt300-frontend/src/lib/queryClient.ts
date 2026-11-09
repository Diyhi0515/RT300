import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { notificar } from '@/shared/avisos/almacen'
import { ERROR_POR_DEFECTO } from './mensajesError'
import { ErrorApi } from './http'

const mensajeDe = (error: unknown) =>
  error instanceof ErrorApi ? error.message : ERROR_POR_DEFECTO

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.notify) notificar.error(mensajeDe(error))
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (!mutation.meta?.silentError) notificar.error(mensajeDe(error))
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, error) =>
        !(error instanceof ErrorApi && error.status >= 400 && error.status < 500) && count < 2,
    },
  },
})
