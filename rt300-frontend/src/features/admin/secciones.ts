import {
  ClipboardList,
  LayoutDashboard,
  Armchair,
  BarChart3,
  UnlockKeyhole,
  UserCog,
  UtensilsCrossed,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface SeccionAdmin {
  clave: string
  etiqueta: string
  icono: LucideIcon
  ruta: string | null
  exacta?: boolean
}

export const seccionesAdmin: SeccionAdmin[] = [
  { clave: 'panel', etiqueta: 'Panel', icono: LayoutDashboard, ruta: '/admin', exacta: true },
  { clave: 'mesas', etiqueta: 'Mesas en servicio', icono: Armchair, ruta: '/admin/mesas' },
  { clave: 'menu', etiqueta: 'Menú', icono: UtensilsCrossed, ruta: '/admin/menu' },
  { clave: 'clientes', etiqueta: 'Clientes', icono: Users, ruta: '/admin/clientes' },
]

export const seccionesProximas: SeccionAdmin[] = [
  { clave: 'liberar', etiqueta: 'Liberar mesa', icono: UnlockKeyhole, ruta: null },
  { clave: 'comandas', etiqueta: 'Comandas', icono: ClipboardList, ruta: null },
  { clave: 'usuarios', etiqueta: 'Usuarios y roles', icono: UserCog, ruta: null },
  { clave: 'reportes', etiqueta: 'Reportes', icono: BarChart3, ruta: null },
]
