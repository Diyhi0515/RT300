import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'

export const servidor = setupServer(
  http.get('*/api/v1/health', () => HttpResponse.json({ status: 'ok', db: true, impresion: 'real' })),
)
