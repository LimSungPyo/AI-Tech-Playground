import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Docker 볼륨에서는 파일 변경 이벤트가 안 와서 폴링으로 감시한다
    watch: { usePolling: process.env.CHOKIDAR_USEPOLLING === 'true' },
    // 포트는 CLI(`--port`)로 받는다. /api는 백엔드로 넘긴다.
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY ?? 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
