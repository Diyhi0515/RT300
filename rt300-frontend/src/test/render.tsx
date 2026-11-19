import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

interface OpcionesRuta {
  ruta: string
  patron: string
}

export const renderConProveedores = (ui: ReactElement, opciones?: OpcionesRuta) => {
  const cliente = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={opciones ? [opciones.ruta] : undefined}>
        {opciones ? (
          <Routes>
            <Route path={opciones.patron} element={ui} />
          </Routes>
        ) : (
          ui
        )}
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
