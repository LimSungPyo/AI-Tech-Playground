import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// 환경 변수는 레포 루트의 .env 하나에서 관리한다. Docker에서는 이 파일이 없고 compose가 값을 넘긴다.
const envDir = fileURLToPath(new URL('..', import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 설정 파일에서는 .env가 process.env에 안 들어가서 직접 읽는다. 셸 환경 변수가 우선한다.
  const env = loadEnv(mode, envDir, '')

  return {
    envDir,
    plugins: [react()],
    server: {
      // Docker 볼륨에서는 파일 변경 이벤트가 안 와서 폴링으로 감시한다
      watch: { usePolling: env.CHOKIDAR_USEPOLLING === 'true' },
      // 포트는 CLI(`--port`)로 받는다. /api는 백엔드로 넘긴다.
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
  }
})
