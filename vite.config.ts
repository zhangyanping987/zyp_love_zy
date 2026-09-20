import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 项目站路径；媒体可通过 VITE_ASSET_BASE 指向阿里云 OSS
  base: '/zyp_love_zy/',
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
