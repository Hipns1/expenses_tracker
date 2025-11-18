import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { URL, fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_PUBLIC_URL

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    base: base
  }
})
