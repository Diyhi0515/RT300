import { TriangleAlert } from 'lucide-react'
import { Button } from './Button'
import { EmptyState } from './EmptyState'

export function RespaldoError({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
  return (
    <div className="grid min-h-[var(--alto-app,100dvh)] place-items-center bg-bg">
      <EmptyState
        icon={<TriangleAlert className="size-8" />}
        title="Algo salió mal"
        description="Ocurrió un error inesperado. Intenta de nuevo."
        action={<Button onClick={resetErrorBoundary}>Reintentar</Button>}
      />
    </div>
  )
}
