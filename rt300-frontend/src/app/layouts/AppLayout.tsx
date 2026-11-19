import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { moduloDeRuta } from '@/features/inicio/modulos'
import { useUltimoModulo } from '@/features/inicio/store'
import { CargadorBloque } from '@/shared/ui/Cargador'
import { EncabezadoApp } from './EncabezadoApp'
import { NavegacionInferior } from './NavegacionInferior'

const VERSION_APP = '0.1.0'

export function AppLayout() {
  const [perfilAbierto, setPerfilAbierto] = useState(false)
  const { pathname } = useLocation()
  const registrar = useUltimoModulo((s) => s.registrar)
  const ocultarPie = pathname.startsWith('/pedidos/comanda/')

  useEffect(() => {
    const modulo = moduloDeRuta(pathname)
    if (modulo) registrar(modulo.clave)
  }, [pathname, registrar])

  return (
    <div className="flex min-h-[var(--alto-app,100dvh)] flex-col bg-bg bg-[radial-gradient(ellipse_70%_40%_at_50%_100%,rgba(34,195,238,0.10),transparent_70%)] text-fg dark:bg-[radial-gradient(ellipse_80%_45%_at_50%_0%,rgba(53,99,233,0.14),transparent_70%)]">
      <EncabezadoApp perfilAbierto={perfilAbierto} alCambiarPerfil={setPerfilAbierto} />
      <main className="px-safe mx-auto w-full max-w-[1440px] flex-1 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-6 sm:pt-8 escritorio:pb-8 short:pb-[calc(env(safe-area-inset-bottom)+64px)] short:pt-4 short:escritorio:pb-4">
        <Suspense fallback={<CargadorBloque label="Cargando…" />}>
          <Outlet />
        </Suspense>
      </main>
      {!ocultarPie && (
        <footer className="px-safe hidden pb-5 text-center text-[11px] leading-relaxed text-muted sm:text-xs escritorio:block short:escritorio:pb-3">
          Santa Cruz, Bolivia · v{VERSION_APP}
        </footer>
      )}
      <NavegacionInferior
        perfilAbierto={perfilAbierto}
        alAbrirPerfil={() => setPerfilAbierto(true)}
      />
    </div>
  )
}
