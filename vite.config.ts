import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 项目站：绝对路径，避免无尾斜杠时 ./media 解析到错误域名路径
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
