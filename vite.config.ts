import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/NamPure/',
  build: {
    outDir: 'dist',
  },
  optimizeDeps: {
    include: ['tesseract.js']
  }
})