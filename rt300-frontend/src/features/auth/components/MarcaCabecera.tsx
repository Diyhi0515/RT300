import { Flag, Wifi, WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'
import { CambiarTema } from '@/shared/ui/CambiarTema'

export function MarcaCabecera() {
  const enLinea = useOnlineStatus()

  return (
    <div className="mb-4 flex shrink-0 items-center justify-between gap-2 short:mb-2">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1">
          <Flag className="size-7 shrink-0 text-club-primary" fill="currentColor" aria-hidden />
          <span className="ml-1 truncate text-lg font-semibold tracking-wide text-club-primary 2xl:text-xl">
            Club de Campo
          </span>
        </div>
        <p
          role="status"
          className={`ml-9 mt-0.5 flex items-center gap-1.5 text-xs font-semibold ${
            enLinea ? 'text-emerald-700 dark:text-emerald-400' : 'text-club-error'
          }`}
        >
          {enLinea ? (
            <Wifi className="size-3.5 shrink-0" aria-hidden />
          ) : (
            <WifiOff className="size-3.5 shrink-0" aria-hidden />
          )}
          {enLinea ? 'En línea' : 'Sin conexión'}
        </p>
      </div>
      <CambiarTema onDark={false} compact className="shrink-0" />
    </div>
  )
}
