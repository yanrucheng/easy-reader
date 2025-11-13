import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  base: '/easy-reader/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020',
  },
  esbuild: {
    target: 'es2020',
  },
})