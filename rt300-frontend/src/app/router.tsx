import { Navigate, createBrowserRouter } from 'react-router-dom'
import { CargadorPantalla } from '@/shared/ui/Cargador'
import { SoloPublico, RequerirRol, RequerirSesion } from './guardas'
import { AdminLayout } from './layouts/AdminLayout'
import { AppLayout } from './layouts/AppLayout'

export const router = createBrowserRouter([
  {
    element: <SoloPublico />,
    HydrateFallback: CargadorPantalla,
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
    HydrateFallback: CargadorPantalla,
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
          { path: '/mesas', element: <Navigate to="/admin" replace /> },
        ],
      },
      {
        element: <RequerirRol roles={['admin']} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              {
                path: '/admin',
                lazy: async () => ({
                  Component: (await import('@/features/admin/pages/PanelPage')).PanelPage,
                }),
              },
              {
                path: '/admin/mesas',
                lazy: async () => ({
                  Component: (await import('@/features/admin/pages/MesasServicioPage'))
                    .MesasServicioPage,
                }),
              },
              {
                path: '/admin/menu',
                lazy: async () => ({
                  Component: (await import('@/features/admin/pages/MenuAdminPage')).MenuAdminPage,
                }),
              },
              {
                path: '/admin/clientes',
                lazy: async () => ({
                  Component: (await import('@/features/admin/pages/ClientesAdminPage'))
                    .ClientesAdminPage,
                }),
              },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/inicio" replace /> },
])
