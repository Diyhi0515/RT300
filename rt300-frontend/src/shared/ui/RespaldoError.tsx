import { RotateCw, TriangleAlert } from 'lucide-react'
import { BandaAxon } from './BandaAxon'

export function RespaldoError({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
  return (
    <div className="flex min-h-[var(--alto-app,100dvh)] flex-col bg-bg">
      <BandaAxon className="h-28 short:h-20" />
      <div className="grid flex-1 place-items-center px-6">
        <div
          role="alert"
          className="flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl border border-line bg-surface px-6 pb-7 pt-0 text-center shadow-card short:gap-2 short:pb-4"
        >
          <span className="-mt-9 grid size-[72px] short:-mt-7 short:size-14 place-items-center rounded-3xl bg-danger text-white shadow-lg ring-4 ring-surface">
            <TriangleAlert className="size-9" strokeWidth={2} aria-hidden />
          </span>
          <h2 className="text-xl font-bold tracking-tight">Algo salió mal</h2>
          <p className="max-w-xs text-pretty text-muted">
            Ocurrió un error inesperado. Intenta de nuevo.
          </p>
          <button
            type="button"
            onClick={resetErrorBoundary}
            className="mt-2 inline-flex h-12 w-full short:h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-club-pc to-club-tertiary font-bold text-white shadow-[0_10px_24px_rgba(43,83,184,.35)] transition hover:brightness-110 active:scale-[0.98]"
          >
            <RotateCw className="size-4" />
            Reintentar
          </button>
        </div>
      </div>
    </div>
  )
}
