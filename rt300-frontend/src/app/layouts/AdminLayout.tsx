import { Suspense, useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import { BarraLateral } from '@/features/admin/components/BarraLateral'
import { CargadorBloque } from '@/shared/ui/Cargador'
import { EncabezadoApp } from './EncabezadoApp'

export function AdminLayout() {
  const [perfilAbierto, setPerfilAbierto] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    if (!menuAbierto) return
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setMenuAbierto(false)
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [menuAbierto])

  return (
    <div className="flex min-h-[var(--alto-app,100dvh)] flex-col bg-bg text-fg">
      <EncabezadoApp perfilAbierto={perfilAbierto} alCambiarPerfil={setPerfilAbierto} />
      <div className="flex min-h-0 flex-1">
        <BarraLateral abierta={menuAbierto} alCerrar={() => setMenuAbierto(false)} />
        <main className="px-safe min-w-0 flex-1 pb-8 pt-4 sm:pt-6">
          <button
            type="button"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú de administración"
            className="mb-4 inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-semibold transition hover:border-primary/50 active:scale-95 lg:hidden"
          >
            <Menu className="size-4" />
            Menú
          </button>
          <div key={pathname} className="mx-auto w-full max-w-6xl">
            <Suspense fallback={<CargadorBloque label="Cargando…" />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
