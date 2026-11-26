import { Flag, Wifi, WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'
import { CambiarTema } from '@/shared/ui/CambiarTema'
import { useNombreNegocio } from '../hooks'

export function MarcaCabecera() {
  const enLinea = useOnlineStatus()
  // Si la base no responde se muestra el nombre de la aplicación.
  const nombre = useNombreNegocio().data ?? 'RT - AXON'

  return (
    <div className="mb-4 flex shrink-0 items-center justify-between gap-2 short:mb-1 laptop:mb-5">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1">
          <Flag
            className="size-7 shrink-0 short:size-6 laptop:size-7 text-club-primary"
            fill="currentColor"
            aria-hidden
          />
          <span
            title={nombre}
            className="ml-1 line-clamp-2 min-w-0 text-lg font-semibold leading-tight short:text-base laptop:text-lg tracking-wide text-club-primary 2xl:text-xl"
          >
            {nombre}
          </span>
        </div>
        <p
          role="status"
          className={`ml-9 mt-0.5 flex items-center gap-1.5 text-xs short:ml-8 short:text-[11px] font-semibold ${
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
