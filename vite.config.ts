/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { loadEnv, type Plugin } from 'vite'

/**
 * In sviluppo `vite` non esegue le Vercel Functions in /api: questo plugin
 * carica le env server-side (inclusa GOOGLE_CALENDAR_ICAL_URL) e inoltra
 * GET / POST /api/google-calendar allo stesso handler usato in produzione.
 */
function devApiFunctions(): Plugin {
  return {
    name: 'dev-api-functions',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, '')
      if (env.GOOGLE_CALENDAR_ICAL_URL !== undefined && process.env.GOOGLE_CALENDAR_ICAL_URL === undefined) {
        process.env.GOOGLE_CALENDAR_ICAL_URL = env.GOOGLE_CALENDAR_ICAL_URL
      }

      server.middlewares.use('/api/google-calendar', async (req, res) => {
        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const mod = await server.ssrLoadModule('/api/google-calendar.ts')
          const method = req.method ?? 'GET'
          const request = new Request('http://localhost/api/google-calendar', {
            method,
            headers: { 'content-type': req.headers['content-type'] ?? 'application/json' },
            body: method === 'GET' || method === 'HEAD' ? undefined : Buffer.concat(chunks),
          })
          const response: Response =
            method === 'GET'
              ? await mod.GET()
              : method === 'POST'
                ? await mod.POST(request)
                : new Response('Method Not Allowed', { status: 405 })
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (err) {
          res.statusCode = 500
          res.end(String(err))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    devApiFunctions(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icons/*.png', 'screenshots/*.png', 'splash/*.png'],
      manifest: {
        name: 'Workout App',
        short_name: 'Workout',
        description: 'Personal workout tracking app',
        lang: 'it',
        theme_color: '#09090A',
        background_color: '#09090A',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        screenshots: [
          {
            src: 'screenshots/home-narrow.png',
            sizes: '393x852',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Home - Scheda e prossimo allenamento'
          },
          {
            src: 'screenshots/workout-narrow.png',
            sizes: '393x852',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Workout - Panoramica esercizi e serie'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-framer': ['framer-motion'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@features': path.resolve(__dirname, './src/features'),
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/shared/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/._*']
  }
})
