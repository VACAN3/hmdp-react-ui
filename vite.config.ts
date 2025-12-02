import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    base: env.VITE_APP_CONTEXT_PATH || '/',
    server: {
      host: '0.0.0.0',
      port: Number(env.VITE_APP_PORT) || 83,
      open: true,
      proxy: {
        '/api': {
          target: 'http://106.75.133.106',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        [env.VITE_APP_BASE_API]: {
          target: env.VITE_APP_TEST_URL,
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp('^' + env.VITE_APP_BASE_API), ''),
        },
        '/ai': {
          target: env.VITE_APP_CHAT_URL,
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(/^\/ai/, ''),
        },
      },
    },
  }
})
