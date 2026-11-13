import { describe, expect, it } from 'vitest'
import { filtroDeBusqueda } from './busqueda'

describe('filtroDeBusqueda', () => {
  it('solo números busca por código', () => {
    expect(filtroDeBusqueda(' 17 ')).toEqual({ codigo: 17 })
  })
  it('dos o más letras buscan por nombre', () => {
    expect(filtroDeBusqueda(' ana ')).toEqual({ nombre: 'ana' })
  })
  it('una sola letra o vacío no busca', () => {
    expect(filtroDeBusqueda('a')).toBeNull()
    expect(filtroDeBusqueda('   ')).toBeNull()
  })
})
