import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { LogOut, WifiOff } from 'lucide-react'
import { useSesion, useCerrarSesion } from '@/features/auth'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'
import { CargadorBloque } from '@/shared/ui/Cargador'
import { CambiarTema } from '@/shared/ui/CambiarTema'

export function AppLayout() {
  const perfil = useSesion((s) => s.perfil)
  const salir = useCerrarSesion()
  const online = useOnlineStatus()

  return (
    <div className="flex min-h-dvh flex-col bg-bg dark:bg-[radial-gradient(ellipse_80%_45%_at_50%_0%,rgba(53,99,233,0.22),transparent_70%)]">
      <header className="pt-safe sticky top-0 z-30 border-b border-white/10 bg-header/95 text-white shadow-card backdrop-blur supports-[backdrop-filter]:bg-header/85">
        <div className="px-safe mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 sm:h-16 2xl:h-20 2xl:max-w-[1600px]">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/logo-software.png"
              alt="AXON"
              width={180}
              height={60}
              className="h-8 w-auto shrink-0 sm:h-10 2xl:h-12"
            />
            <div className="hidden min-w-0 border-l border-white/15 pl-3 leading-tight sm:block">
              <p className="truncate font-bold">RT-300</p>
              {perfil && (
                <p className="truncate text-xs text-white/60">{perfil.nombre || perfil.usuario}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {perfil && (
              <span
                aria-label={perfil.nombre || perfil.usuario}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-bold sm:hidden"
              >
                {perfil.usuario.slice(0, 2)}
              </span>
            )}
            <CambiarTema />
            <button
              type="button"
              onClick={salir}
              aria-label="Cerrar sesión"
              className="flex h-12 min-w-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 font-semibold transition hover:bg-danger active:scale-95"
            >
              <LogOut className="size-5" />
              <span className="hidden md:inline">Salir</span>
            </button>
          </div>
        </div>
        {!online && (
          <div
            role="status"
            className="flex items-center justify-center gap-2 bg-accent-solid px-4 py-1.5 text-sm font-semibold text-black"
          >
            <WifiOff className="size-4" />
            Sin conexión
          </div>
        )}
      </header>
      <main className="px-safe pb-safe mx-auto w-full max-w-7xl flex-1 py-4 sm:py-6 2xl:max-w-[1600px]">
        <Suspense fallback={<CargadorBloque label="Cargando…" />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
