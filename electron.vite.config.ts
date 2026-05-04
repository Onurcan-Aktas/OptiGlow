import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    entry: 'src/main/index.ts',
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/main'
    }
  },
  preload: {
    entry: 'src/preload/preload.ts',
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/preload'
    }
  },
  renderer: {
    root: 'src/renderer',
    entry: 'src/renderer/src/main.tsx',
    plugins: [react()],
    build: {
      outDir: 'out/renderer'
    },
    css: {
      postcss: './postcss.config.js'
    }
  }
})
