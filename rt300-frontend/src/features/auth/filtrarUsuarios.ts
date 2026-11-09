import type { UsuarioLista } from './types'

const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

export const filtrarUsuarios = (usuarios: UsuarioLista[], busqueda: string) => {
  const terminos = normalizar(busqueda).split(/\s+/).filter(Boolean)
  if (terminos.length === 0) return usuarios
  return usuarios.filter((u) => {
    const texto = normalizar(`${u.usuario} ${u.nombre}`)
    return terminos.every((termino) => texto.includes(termino))
  })
}
