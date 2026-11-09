import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { CargadorPantalla } from '@/shared/ui/Cargador'
import { Providers } from './providers'
import { router } from './router'

export function App() {
  return (
    <Providers>
      <Suspense fallback={<CargadorPantalla />}>
        <RouterProvider router={router} />
      </Suspense>
    </Providers>
  )
}
