import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSesion, type Rol } from '@/features/auth'

export function RequerirSesion() {
  const perfil = useSesion((s) => s.perfil)
  const location = useLocation()
  if (!perfil) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

export function RequerirRol({ roles }: { roles: Rol[] }) {
  const perfil = useSesion((s) => s.perfil)
  if (!perfil || !roles.includes(perfil.rol)) return <Navigate to="/inicio" replace />
  return <Outlet />
}

export function SoloPublico() {
  const perfil = useSesion((s) => s.perfil)
  if (perfil) return <Navigate to="/inicio" replace />
  return <Outlet />
}
