import type { Perfil, UsuarioLista } from '@/features/auth/types'

export const CLAVE_SIMULADA = '123456'

const CLAVE_PRUEBA = 'prueba'

export const claveDe = (usuario: string) => (usuario === 'PRUEBA' ? CLAVE_PRUEBA : CLAVE_SIMULADA)

export const usuarios: UsuarioLista[] = [
  { usuario: 'MCB', nombre: 'Maestro de Caja & Barra Principal' },
  { usuario: 'PRUEBA', nombre: 'Usuario de prueba' },
  { usuario: 'GP1', nombre: 'Terraza' },
  { usuario: 'GP2', nombre: 'Terraza' },
  { usuario: 'GP3', nombre: 'Piscina' },
  { usuario: 'GP4', nombre: 'Piscina' },
  { usuario: 'GP5', nombre: 'Salón' },
  { usuario: 'GP6', nombre: 'Salón' },
  { usuario: 'GP7', nombre: 'Jardín' },
  { usuario: 'GP8', nombre: 'Jardín' },
  { usuario: 'GP9', nombre: 'Golf' },
  { usuario: 'GP10', nombre: 'Golf' },
  { usuario: 'GP11', nombre: 'Tenis' },
  { usuario: 'GP12', nombre: 'Tenis' },
  { usuario: 'GP15', nombre: 'Eventos' },
  { usuario: 'GP18', nombre: 'Eventos' },
  { usuario: 'GP20', nombre: 'Pérgola' },
  { usuario: 'GP25', nombre: 'Pérgola' },
  { usuario: 'GP30', nombre: 'Refuerzo' },
]

export const perfilDe = (usuario: string): Perfil | null => {
  const encontrado = usuarios.find((u) => u.usuario === usuario)
  if (!encontrado) return null
  return {
    usuario: encontrado.usuario,
    nombre: encontrado.nombre,
    local: 'Club de Campo',
    rol: encontrado.usuario === 'MCB' || encontrado.usuario === 'PRUEBA' ? 'admin' : 'garzon',
  }
}
