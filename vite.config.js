import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Electron needs relative paths in the built files
  base: mode === 'production' ? './' : '/',
}))
