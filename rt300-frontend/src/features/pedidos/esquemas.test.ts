import { describe, expect, it } from 'vitest'
import { esquemaRespuestaInicio, esquemaRespuestaUsuarios } from '@/features/auth/esquemas'
import clienteDetalle from '@/test/fixtures/cliente-detalle.json'
import clientesBusqueda from '@/test/fixtures/clientes-busqueda.json'
import detalleFolio from '@/test/fixtures/detalle-folio.json'
import login from '@/test/fixtures/login.json'
import mesas from '@/test/fixtures/mesas.json'
import parametros from '@/test/fixtures/parametros.json'
import platos from '@/test/fixtures/platos.json'
import secciones from '@/test/fixtures/secciones.json'
import usuarios from '@/test/fixtures/usuarios.json'
import {
  esquemaDetalleFolio,
  esquemaParametros,
  esquemaPlatos,
  esquemaRespuestaClientes,
  esquemaRespuestaMesas,
  esquemaSecciones,
} from './esquemas'

describe('contrato con el backend (respuestas reales capturadas con npm run fixtures)', () => {
  it('login: perfil con local, rol y código de mesero', () => {
    const r = esquemaRespuestaInicio.parse(login)
    expect(r.perfil.local).toBeTruthy()
    expect(['garzon', 'cajero', 'admin']).toContain(r.perfil.rol)
  })

  it('usuarios: lista envuelta en { usuarios }', () => {
    expect(esquemaRespuestaUsuarios.parse(usuarios).usuarios.length).toBeGreaterThan(0)
  })

  it('parametros: áreas con código y nombre', () => {
    const r = esquemaParametros.parse(parametros)
    expect(r.areas.length).toBeGreaterThan(0)
    expect(r.areas[0]).toMatchObject({ codigo: expect.any(Number) })
  })

  it('mesas: todas se leen y las ocupadas traen su servicio', () => {
    const r = esquemaRespuestaMesas.parse(mesas).mesas
    const ocupada = r.find((m) => m.folio)
    expect(ocupada).toMatchObject({ mozo: expect.any(String), apertura: expect.any(String), cuentas: expect.any(Number) })
  })

  it('detalle del folio: cuentas con sus líneas', () => {
    const cuentas = esquemaDetalleFolio.parse(detalleFolio).cuentas
    expect(cuentas[0].lineas[0]).toMatchObject({ cart: expect.any(String), cant: expect.any(Number), pvta: expect.any(Number) })
  })

  it('menú: secciones (con subsecciones) y platos con precio', () => {
    expect(esquemaSecciones.parse(secciones).secciones.some((s) => s.cssm > 0)).toBe(true)
    expect(esquemaPlatos.parse(platos).platos[0]).toMatchObject({ pvta: expect.any(Number), moneda: expect.any(String) })
  })

  it('clientes: la búsqueda y el detalle traen código, nombre y NIT', () => {
    expect(esquemaRespuestaClientes.parse(clientesBusqueda).clientes[0]).toHaveProperty('nruc')
    expect(esquemaRespuestaClientes.parse(clienteDetalle).clientes[0].codigo).toBe(17)
  })

  it('un cambio de contrato se detecta: una mesa sin el código falla', () => {
    expect(() => esquemaRespuestaMesas.parse({ mesas: [{ folio: 1 }] })).toThrow()
  })

  it('las respuestas capturadas no contienen datos personales', () => {
    const texto = JSON.stringify([usuarios, mesas, detalleFolio, clientesBusqueda, clienteDetalle])
    expect(texto).not.toMatch(/"(nruc|ndid)":\s*"[1-9]/)
    expect(texto).not.toMatch(/"(nombre|mozo|cliente)":\s*"(?!NOMBRE |MOZO |CLIENTE )[A-ZÁÉÍÓÚÑ]/)
  })
})
