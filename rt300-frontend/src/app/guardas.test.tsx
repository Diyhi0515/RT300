import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { useSesion, type Rol } from '@/features/auth'
import { modulosDelRol } from '@/features/inicio/modulos'
import { RequerirRol } from './guardas'

const entrar = (rol: Rol | null) =>
  useSesion.setState({
    perfil: rol ? { usuario: 'U1', nombre: 'Usuario Uno', local: '2', rol } : null,
  })

const verAdmin = () =>
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route element={<RequerirRol roles={['admin']} />}>
          <Route path="/admin" element={<p>Zona admin</p>} />
        </Route>
        <Route path="/inicio" element={<p>Inicio</p>} />
      </Routes>
    </MemoryRouter>,
  )

describe('RequerirRol', () => {
  it('deja pasar al administrador', () => {
    entrar('admin')
    verAdmin()
    expect(screen.getByText('Zona admin')).toBeInTheDocument()
  })

  it.each<Rol>(['garzon', 'cajero'])('manda a inicio al rol %s', (rol) => {
    entrar(rol)
    verAdmin()
    expect(screen.queryByText('Zona admin')).not.toBeInTheDocument()
    expect(screen.getByText('Inicio')).toBeInTheDocument()
  })

  it('manda a inicio si no hay sesión', () => {
    entrar(null)
    verAdmin()
    expect(screen.getByText('Inicio')).toBeInTheDocument()
  })
})

describe('módulos por rol', () => {
  it('Administración solo aparece para el administrador', () => {
    expect(modulosDelRol('admin').map((m) => m.clave)).toContain('administracion')
    expect(modulosDelRol('garzon').map((m) => m.clave)).not.toContain('administracion')
    expect(modulosDelRol('cajero').map((m) => m.clave)).toContain('pedidos')
  })
})
