import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig, type Plugin } from 'vite'

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

const dominiosNgrok = [
  '.ngrok-free.app',
  '.ngrok-free.dev',
  '.ngrok.app',
  '.ngrok.dev',
  '.ngrok.io',
]

export default defineConfig({
  plugins: [
    appMode(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
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
        background_color: '#0a1a3d',
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
    proxy: { '/api': 'http://localhost:5000' },
  },
  preview: {
    allowedHosts: dominiosNgrok,
  },
})
