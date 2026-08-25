import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // 핵심 로직(폼 검증, SSE 파싱, 예약시각 변환)만 유닛테스트 - DOM 렌더링 없어서 jsdom 불필요
    environment: 'node',
  },
  server: {
    // 로컬 dev 서버에서도 운영(nginx)과 동일하게 /api를 BE로 프록시.
    // 이렇게 하면 프론트가 절대경로(http://localhost:8080)로 직접 호출할 때 생기는
    // CORS 문제 없이, BE 쪽 CORS 설정 변경 없이 바로 연동 테스트 가능.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
