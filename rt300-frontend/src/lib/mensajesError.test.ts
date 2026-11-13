import { describe, expect, it } from 'vitest'
import { ERROR_POR_DEFECTO, resolverMensajeError } from './mensajesError'

describe('resolverMensajeError', () => {
  it('el código conocido tiene prioridad', () => {
    expect(resolverMensajeError('MESA_OCUPADA', 409, 'texto del servidor')).toBe('La mesa ya está ocupada.')
  })
  it('sin código conocido usa el mensaje del servidor', () => {
    expect(resolverMensajeError('OTRO', 400, 'Dato inválido')).toBe('Dato inválido')
  })
  it('sin mensaje usa el estado HTTP', () => {
    expect(resolverMensajeError(undefined, 429)).toBe('Demasiados intentos. Espera un momento.')
  })
  it('sin nada usa el mensaje por defecto', () => {
    expect(resolverMensajeError(undefined, 418)).toBe(ERROR_POR_DEFECTO)
  })
})
