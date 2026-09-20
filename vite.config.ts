import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 相对路径：本地、Nginx 子目录、GitHub Pages 都能直接打开
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three'
          if (
            id.includes('node_modules/@react-three/fiber') ||
            id.includes('node_modules/@react-three/drei') ||
            id.includes('node_modules/three-stdlib')
          ) {
            return 'r3f'
          }
        },
      },
    },
  },
})
