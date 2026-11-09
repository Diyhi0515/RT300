export type Rol = 'garzon' | 'cajero' | 'admin'

export interface Perfil {
  usuario: string
  nombre: string
  local: string
  rol: Rol
}

export interface UsuarioLista {
  usuario: string
  nombre: string
}
