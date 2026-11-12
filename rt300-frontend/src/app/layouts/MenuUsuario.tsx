import { useRef } from 'react'
import { BadgeCheck, ChevronDown, LogOut, MapPin } from 'lucide-react'
import { useCerrarSesion, useSesion } from '@/features/auth'
import { iniciales } from '@/lib/iniciales'
import { useClickExterior } from '@/shared/hooks/useClickExterior'

interface MenuUsuarioProps {
  abierto: boolean
  alCambiar: (abierto: boolean) => void
}

const ROLES = { garzon: 'Garzón', cajero: 'Cajero', admin: 'Administrador' } as const

export function MenuUsuario({ abierto, alCambiar }: MenuUsuarioProps) {
  const perfil = useSesion((s) => s.perfil)
  const salir = useCerrarSesion()
  const contenedor = useRef<HTMLDivElement>(null)
  useClickExterior(contenedor, abierto, () => alCambiar(false))

  if (!perfil) return null
  const nombre = perfil.nombre || perfil.usuario
  const sigla = iniciales(nombre)

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => alCambiar(!abierto)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label="Menú de usuario"
        className={`flex cursor-pointer items-center gap-3 rounded-full py-1 pl-1 pr-1 transition sm:pl-4 sm:pr-1.5 ${
          abierto ? 'bg-white/10' : 'hover:bg-white/[0.07]'
        }`}
      >
        <span className="hidden min-w-0 text-right sm:block">
          <strong className="block max-w-[200px] truncate text-[13px] font-semibold text-white">
            {nombre}
          </strong>
          <small className="block text-[11px] tracking-wide text-[#89b3d9]">
            {ROLES[perfil.rol]}
          </small>
        </span>
        <span className="relative">
          <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#1b8ef2] to-[#0875cf] text-sm font-bold text-white shadow-[0_0_0_3px_rgba(27,142,242,.22)]">
            {sigla}
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 grid size-[18px] place-items-center rounded-full bg-header ring-2 ring-header">
            <ChevronDown
              className={`size-3 text-white transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`}
            />
          </span>
        </span>
      </button>

      <div
        aria-hidden
        onClick={() => alCambiar(false)}
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 sm:hidden ${
          abierto ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <div
        role="menu"
        className={`fixed inset-x-0 bottom-0 z-[70] flex max-h-[90dvh] flex-col overflow-hidden rounded-t-[32px] border-t border-line bg-surface text-fg shadow-[0_-24px_70px_rgba(1,21,38,.25)] transition-[opacity,transform] duration-300 ease-out sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-[calc(100%+10px)] sm:max-h-none short:sm:max-h-[calc(var(--alto-app,100dvh)-5rem)] sm:w-[340px] sm:origin-top-right sm:rounded-3xl sm:border sm:duration-200 ${
          abierto
            ? 'translate-y-0 opacity-100 sm:scale-100'
            : 'pointer-events-none translate-y-full opacity-0 sm:translate-y-0 sm:scale-95'
        }`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-x-0 -top-24 mx-auto size-72 bg-radial from-[#1b8ef2]/25 to-transparent to-70%" />
          <div className="rejilla-fondo absolute inset-0 hidden opacity-[0.07] dark:block" />
        </div>
        <div className="relative overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+22px)] pt-3 sm:pb-5 sm:pt-5">
          <span className="mx-auto mb-4 block h-1.5 w-11 rounded-full bg-line sm:hidden" />

          <div className="flex flex-col items-center text-center">
            <span className="grid size-[92px] short:size-14 place-items-center rounded-full bg-[conic-gradient(from_180deg,#1b8ef2,#22c3ee,#5cb3ff,#1b8ef2)] p-[3px] shadow-[0_0_40px_rgba(27,142,242,.45)] sm:size-20">
              <span className="grid size-full place-items-center rounded-full bg-surface p-1">
                <span className="grid size-full place-items-center rounded-full bg-gradient-to-br from-[#1b8ef2] to-[#0757a8] text-3xl font-bold text-white sm:text-2xl">
                  {sigla}
                </span>
              </span>
            </span>
            <strong className="mt-3 block max-w-full truncate text-xl font-bold tracking-tight sm:text-lg">
              {nombre}
            </strong>
            <span className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full bg-gradient-to-r from-[#1b8ef2]/25 to-[#22c3ee]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0875cf] ring-1 ring-[#1b8ef2]/40 dark:text-[#7cc4ff]">
              <BadgeCheck className="size-[13px] shrink-0" />
              <span className="truncate">{ROLES[perfil.rol]}</span>
            </span>
          </div>

          <div className="mt-5 short:mt-3 flex items-center gap-3 rounded-2xl border border-line bg-bg px-3 py-3 short:py-2">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="size-[18px]" />
            </span>
            <span className="min-w-0 text-left">
              <strong className="block truncate text-sm font-semibold">{perfil.local}</strong>
              <small className="block truncate text-[11px] text-muted">
                Usuario {perfil.usuario}
              </small>
            </span>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={salir}
            className="group mt-4 short:mt-3 flex h-[52px] short:h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#e5484d] to-[#c42b3a] text-sm font-bold text-white shadow-[0_12px_28px_rgba(229,72,77,.35)] transition hover:brightness-110 active:scale-[0.98] sm:h-12"
          >
            <LogOut className="size-[18px] transition-transform group-hover:translate-x-0.5" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
