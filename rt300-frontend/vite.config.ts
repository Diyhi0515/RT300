import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig, loadEnv, type Plugin } from 'vite'

const carpetaGeneral = fileURLToPath(new URL('..', import.meta.url))

for (const [clave, valor] of Object.entries(loadEnv('', carpetaGeneral, 'VITE_'))) {
  process.env[clave] ??= valor
}

const normalize = (path: string) => path.split('\\').join('/')

const envFile = normalize(fileURLToPath(new URL('./src/lib/env.ts', import.meta.url)))

const readAppMode = () =>
  /APP_MODE\s*:\s*AppMode\s*=\s*'(mockup|production)'/.exec(readFileSync(envFile, 'utf8'))?.[1] ??
  'production'

const versionCompilacion = new Date().toISOString().replace(/\D/g, '').slice(0, 14)

const appMode = (): Plugin => ({
  name: 'rt300-app-mode',
  config: () => ({
    define: {
      __APP_MODE__: JSON.stringify(readAppMode()),
      __APP_VERSION__: JSON.stringify(versionCompilacion),
    },
  }),
  configureServer(server) {
    server.watcher.add(envFile)
    server.watcher.on('change', (file) => {
      if (normalize(file) === envFile) void server.restart()
    })
  },
})

const SERVICE_WORKER_LIMPIEZA = `self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      const claves = await caches.keys()
      await Promise.all(claves.map((clave) => caches.delete(clave)))
      await self.registration.unregister()
      const ventanas = await self.clients.matchAll({ type: 'window' })
      ventanas.forEach((ventana) => ventana.navigate(ventana.url))
    })(),
  )
})
`

const limpiarServiceWorkerViejo = (): Plugin => ({
  name: 'rt300-limpiar-service-worker-viejo',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const ruta = req.url?.split('?')[0]
      if (ruta !== '/sw.js' && ruta !== '/dev-sw.js') return next()
      res.setHeader('Content-Type', 'text/javascript')
      res.setHeader('Cache-Control', 'no-store')
      res.end(SERVICE_WORKER_LIMPIEZA)
    })
  },
})

const dominiosNgrok = [
  '.ngrok-free.app',
  '.ngrok-free.dev',
  '.ngrok.app',
  '.ngrok.dev',
  '.ngrok.io',
]

// En Docker el back no está en 127.0.0.1 del contenedor del front: docker-compose pone API_PROXY_TARGET.
const destinoApi = process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:5000'

export default defineConfig({
  plugins: [
    appMode(),
    limpiarServiceWorkerViejo(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      useCredentials: true,
      includeAssets: ['icono-pestana-32.png'],
      manifest: {
        name: 'RT - AXON',
        short_name: 'RT - AXON',
        related_applications: [{ platform: 'webapp', url: '/manifest.webmanifest' }],
        description: 'Toma de pedidos de restaurante',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#ffffff',
        theme_color: '#0a1a3d',
        icons: [
          { src: 'icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icono-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2,png,webp}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    allowedHosts: dominiosNgrok,
    proxy: { '/api': destinoApi },
  },
  preview: {
    allowedHosts: dominiosNgrok,
    proxy: { '/api': destinoApi },
  },
})
