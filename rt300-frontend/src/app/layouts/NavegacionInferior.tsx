import { House } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useSesion } from '@/features/auth'
import { moduloDeRuta, moduloPorClave } from '@/features/inicio/modulos'
import { useUltimoModulo } from '@/features/inicio/store'
import { iniciales } from '@/lib/iniciales'

interface NavegacionInferiorProps {
  perfilAbierto: boolean
  alAbrirPerfil: () => void
}

const base =
  'relative flex cursor-pointer flex-col items-center justify-center gap-1 short:flex-row short:gap-2'
const iconoActivo =
  'grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-club-pc to-club-tertiary text-white shadow-[0_8px_18px_rgba(43,83,184,.45)] short:size-8 short:rounded-xl'
const iconoInactivo =
  'grid size-10 place-items-center rounded-2xl text-muted transition-colors active:bg-primary/10 short:size-8 short:rounded-xl'

const indicador = (
  <span className="absolute top-0 h-[3px] w-12 rounded-b-full bg-gradient-to-r from-club-pc to-club-sc shadow-[0_0_12px_rgba(152,192,255,.7)]" />
)

const etiqueta = (activa: boolean) =>
  `max-w-full truncate text-[11px] short:text-xs ${
    activa ? 'font-bold text-primary' : 'font-semibold text-muted'
  }`

export function NavegacionInferior({ perfilAbierto, alAbrirPerfil }: NavegacionInferiorProps) {
  const perfil = useSesion((s) => s.perfil)
  const { pathname } = useLocation()
  const ultimo = useUltimoModulo((s) => s.clave)
  const sigla = iniciales(perfil?.nombre || perfil?.usuario || '')

  const modulo = moduloDeRuta(pathname) ?? moduloPorClave(ultimo)
  const enInicio = pathname === '/inicio'

  return (
    <nav
      aria-label="Navegación de la app"
      className="fixed inset-x-0 bottom-0 z-40 escritorio:hidden"
    >
      <div className="relative overflow-hidden rounded-t-[28px] border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-14px_36px_rgba(1,21,38,.12)] short:rounded-t-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-30%,rgba(43,83,184,.14),transparent_60%)] dark:bg-[radial-gradient(circle_at_50%_-30%,rgba(43,83,184,.35),transparent_60%)]" />
        <div
          className={`relative mx-auto grid h-[72px] max-w-md px-3 short:h-12 short:max-w-xl ${
            modulo?.ruta ? 'grid-cols-3' : 'grid-cols-2'
          }`}
        >
          {modulo?.ruta && (
            <NavLink
              key={modulo.clave}
              to={modulo.ruta}
              className={`${base} animate-[chip-in_0.35s_ease-out_both]`}
            >
              {({ isActive }) => (
                <>
                  {isActive && indicador}
                  <span className={isActive ? iconoActivo : iconoInactivo}>
                    <modulo.icono
                      className="size-5 short:size-4"
                      strokeWidth={isActive ? 2.2 : 2}
                    />
                  </span>
                  <span className={etiqueta(isActive)}>{modulo.etiqueta}</span>
                </>
              )}
            </NavLink>
          )}

          <NavLink to="/inicio" className={base}>
            {enInicio && indicador}
            <span className={enInicio ? iconoActivo : iconoInactivo}>
              <House className="size-5 short:size-4" strokeWidth={enInicio ? 2.2 : 2} />
            </span>
            <span className={etiqueta(enInicio)}>Inicio</span>
          </NavLink>

          <button type="button" onClick={alAbrirPerfil} className={base}>
            <span
              className={`grid size-10 place-items-center rounded-2xl transition-colors short:size-8 ${
                perfilAbierto ? 'bg-primary/10' : 'active:bg-primary/10'
              }`}
            >
              <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-club-pc to-club-tertiary text-[11px] font-bold text-white ring-2 ring-club-pc/25 short:size-7">
                {sigla}
              </span>
            </span>
            <span
              className={`text-[11px] short:text-xs ${
                perfilAbierto ? 'font-bold text-fg' : 'font-semibold text-muted'
              }`}
            >
              Perfil
            </span>
          </button>
        </div>
      </div>
    </nav>
  )
}
