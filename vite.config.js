import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'
import { adminDevPlugin } from './scripts/admin-dev-plugin.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), adminDevPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, './src'),
    },
  },
})
