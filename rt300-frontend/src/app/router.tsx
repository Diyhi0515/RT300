import { Navigate, createBrowserRouter } from 'react-router-dom'
import { SoloPublico, RequerirSesion } from './guardas'
import { AppLayout } from './layouts/AppLayout'

export const router = createBrowserRouter([
  {
    element: <SoloPublico />,
    children: [
      {
        path: '/login',
        lazy: async () => ({
          Component: (await import('@/features/auth/pages/PaginaInicioSesion')).PaginaInicioSesion,
        }),
      },
    ],
  },
  {
    element: <RequerirSesion />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/inicio',
            lazy: async () => ({
              Component: (await import('@/features/inicio/pages/InicioPage')).InicioPage,
            }),
          },
          {
            path: '/pedidos',
            lazy: async () => ({
              Component: (await import('@/features/pedidos/pages/PedidosPage')).PedidosPage,
            }),
          },
          {
            path: '/pedidos/cuentas/:codigo',
            lazy: async () => ({
              Component: (await import('@/features/pedidos/pages/DatosCuentasPage'))
                .DatosCuentasPage,
            }),
          },
          {
            path: '/mesas',
            lazy: async () => ({
              Component: (await import('@/features/salon/pages/MesasPage')).MesasPage,
            }),
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/inicio" replace /> },
])
