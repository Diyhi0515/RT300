import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import { queryClient } from '@/lib/queryClient'
import { ContenedorAvisos } from '@/shared/avisos/ContenedorAvisos'
import { RespaldoError } from '@/shared/ui/RespaldoError'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={RespaldoError}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ContenedorAvisos />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
