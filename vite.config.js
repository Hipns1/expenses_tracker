import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { URL, fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(function (_a) {
  var mode = _a.mode
  var env = loadEnv(mode, process.cwd(), '')
  var base = env.VITE_PUBLIC_URL
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    base: base,
    server: { port: 3001 }
  }
})
