import { ArrowRight, Loader2, LockKeyhole, WifiOff } from 'lucide-react'
import { formatoTiempo } from '../useBloqueo'

interface BotonIngresoProps {
  cargando: boolean
  enLinea: boolean
  bloqueado: boolean
  restante: number
  onBloqueado: () => void
}

const estiloBase =
  'flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-base font-bold shadow-lg transition duration-150 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 short:h-11 2xl:h-16 2xl:text-lg'

const estiloNormal =
  'bg-club-pc text-white shadow-club-pc/30 dark:shadow-[0_8px_28px_-6px_rgba(79,124,255,0.65)]'

const estiloBloqueado =
  'bg-club-error-c text-club-error shadow-club-error/20 ring-1 ring-club-error/30'

export function BotonIngreso({
  cargando,
  enLinea,
  bloqueado,
  restante,
  onBloqueado,
}: BotonIngresoProps) {
  return (
    <div className="mt-4 space-y-4 short:mt-2.5 short:space-y-2.5">
      {!enLinea && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-xl bg-club-error-c px-4 py-3 text-sm font-semibold text-club-error"
        >
          <WifiOff className="size-4 shrink-0" aria-hidden />
          Sin conexión. Reconecta para ingresar.
        </p>
      )}

      <button
        type="submit"
        disabled={cargando || !enLinea}
        onClick={(evento) => {
          if (!bloqueado) return
          evento.preventDefault()
          onBloqueado()
        }}
        className={`${estiloBase} ${bloqueado ? estiloBloqueado : estiloNormal}`}
      >
        {cargando ? (
          <>
            <Loader2 className="size-[22px] animate-spin" aria-hidden />
            <span>Ingresando...</span>
          </>
        ) : bloqueado ? (
          <>
            <LockKeyhole className="size-[22px]" aria-hidden />
            <span>Bloqueado · {formatoTiempo(restante)}</span>
          </>
        ) : (
          <>
            <span>Siguiente</span>
            <ArrowRight className="size-[22px]" aria-hidden />
          </>
        )}
      </button>
    </div>
  )
}
