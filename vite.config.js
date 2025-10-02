import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: true
    },
    define: {
      // Environment-aware configuration
      'import.meta.env.VITE_ENVIRONMENT': JSON.stringify(env.VITE_ENVIRONMENT || 'development'),
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(env.VITE_GOOGLE_CLIENT_ID || '1079648073253-kueo7mpri415h10dsc0fldeoecp878l6.apps.googleusercontent.com'),
      'import.meta.env.VITE_CHAINY_API': JSON.stringify(env.VITE_CHAINY_API || 'https://9qwxcajqf9.execute-api.ap-northeast-1.amazonaws.com'),
      'import.meta.env.VITE_GOOGLE_REDIRECT_URI': JSON.stringify(env.VITE_GOOGLE_REDIRECT_URI || 'http://localhost:3000'),
      'import.meta.env.VITE_DEBUG_MODE': JSON.stringify(env.VITE_DEBUG_MODE === 'true'),
      'import.meta.env.VITE_CORS_DEBUG': JSON.stringify(env.VITE_CORS_DEBUG === 'true')
    }
  }
})
