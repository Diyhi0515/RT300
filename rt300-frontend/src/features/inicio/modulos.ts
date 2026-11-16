import { ClipboardList, ShieldCheck, Wallet, type LucideIcon } from 'lucide-react'
import type { Rol } from '@/features/auth'
import type { TonoModulo } from './components/TarjetaModulo'

export type ClaveModulo = 'administracion' | 'pedidos' | 'ventas'

export interface Modulo {
  clave: ClaveModulo
  etiqueta: string
  descripcion: string
  icono: LucideIcon
  tono: TonoModulo
  ruta: string | null
  roles?: Rol[]
}

export const modulos: Modulo[] = [
  {
    clave: 'administracion',
    etiqueta: 'Administración',
    descripcion: 'Mesas, zonas y control del salón.',
    icono: ShieldCheck,
    tono: 'azul',
    ruta: '/admin',
    roles: ['admin'],
  },
  {
    clave: 'pedidos',
    etiqueta: 'Pedidos',
    descripcion: 'Comandas abiertas desde cocina hasta el cobro.',
    icono: ClipboardList,
    tono: 'cian',
    ruta: '/pedidos',
  },
  {
    clave: 'ventas',
    etiqueta: 'Ventas',
    descripcion: 'Cobros, cierres y reportes del turno.',
    icono: Wallet,
    tono: 'gris',
    ruta: null,
  },
]

export const moduloPorClave = (clave: ClaveModulo | null) =>
  modulos.find((m) => m.clave === clave) ?? null

export const moduloDeRuta = (ruta: string) =>
  modulos.find((m) => m.ruta && (ruta === m.ruta || ruta.startsWith(`${m.ruta}/`))) ?? null

export const modulosDelRol = (rol: Rol) => modulos.filter((m) => !m.roles || m.roles.includes(rol))
