import { CalendarDays } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useSesion } from '@/features/auth'
import { fechaLarga, primerNombre, saludoSegunHora } from '@/features/inicio/saludo'
import { CambiarTema } from '@/shared/ui/CambiarTema'
import { MenuUsuario } from './MenuUsuario'

interface EncabezadoAppProps {
  perfilAbierto: boolean
  alCambiarPerfil: (abierto: boolean) => void
}

export function EncabezadoApp({ perfilAbierto, alCambiarPerfil }: EncabezadoAppProps) {
  const perfil = useSesion((s) => s.perfil)
  const { pathname } = useLocation()
  const esInicio = pathname === '/inicio'
  const nombre = primerNombre(perfil?.nombre || perfil?.usuario || '')

  return (
    <header
      className={`pt-safe relative z-[45] bg-header text-white shadow-[0_8px_26px_rgba(1,21,38,.35)] ${
        esInicio
          ? 'rounded-b-[32px] border-b-2 border-[#1b8ef2] md:rounded-none'
          : 'sticky top-0 border-b border-white/10'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(27,142,242,0.22),transparent_45%),radial-gradient(circle_at_90%_100%,rgba(137,179,217,0.1),transparent_40%)]" />
        <div className="rejilla-fondo absolute inset-0 opacity-[0.06]" />
      </div>

      <div className="px-safe relative mx-auto max-w-6xl">
        <div className="flex h-16 items-center justify-between gap-3 sm:h-[72px] short:h-14">
          <img
            src="/logo-software.png"
            alt="AXON"
            width={180}
            height={60}
            className="h-9 w-auto sm:h-10 short:h-8"
          />
          <div className="flex items-center gap-2 sm:gap-3">
            <CambiarTema compact />
            <MenuUsuario abierto={perfilAbierto} alCambiar={alCambiarPerfil} />
          </div>
        </div>

        {esInicio && (
          <div className="pb-8 pt-3 text-left md:pb-12 md:pt-6 md:text-center short:pb-4 short:pt-0">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/75 md:hidden short:hidden">
              <CalendarDays className="size-3.5" />
              {fechaLarga()}
            </span>
            <p className="text-sm font-semibold text-[#4da8ff]">{saludoSegunHora()}</p>
            <h1 className="mt-1 text-[34px] font-extrabold leading-tight tracking-tight md:text-5xl short:text-2xl">
              Hola, <span className="text-[#38b6ff]">{nombre}</span>
            </h1>
            <p className="mt-3 hidden text-sm text-[#89b3d9] md:block short:hidden">
              Selecciona el módulo con el que deseas trabajar en RT - AXON.
            </p>
          </div>
        )}
      </div>
    </header>
  )
}
