import path from 'node:path'
import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

function normalizeBasePath(value: string | undefined) {
  if (!value || value === '/') return '/'

  return `/${value.replace(/^\/+|\/+$/g, '')}/`
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, '')

  return {
    base: normalizeBasePath(env.VITE_BASE_PATH),
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(projectRoot, 'src'),
      },
    },
  }
})
