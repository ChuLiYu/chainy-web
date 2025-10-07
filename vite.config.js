import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, '.', '')

  // Debug: Log loaded environment variables
  console.log('=== VITE CONFIG DEBUG ===');
  console.log('Mode:', mode);
  console.log('VITE_GOOGLE_CLIENT_ID:', env.VITE_GOOGLE_CLIENT_ID);
  console.log('VITE_CHAINY_API:', env.VITE_CHAINY_API);
  console.log('VITE_GOOGLE_REDIRECT_URI:', env.VITE_GOOGLE_REDIRECT_URI);
  console.log('=== END VITE CONFIG DEBUG ===');

  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: true
    },
    define: {
      // Environment-aware configuration
      'import.meta.env.VITE_ENVIRONMENT': JSON.stringify(env.VITE_ENVIRONMENT || 'production'),
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(env.VITE_GOOGLE_CLIENT_ID || ''),
      'import.meta.env.VITE_CHAINY_API': JSON.stringify(env.VITE_CHAINY_API || ''),
      'import.meta.env.VITE_GOOGLE_REDIRECT_URI': JSON.stringify(env.VITE_GOOGLE_REDIRECT_URI || ''),
      'import.meta.env.VITE_DEBUG_MODE': JSON.stringify(env.VITE_DEBUG_MODE === 'true'),
      'import.meta.env.VITE_CORS_DEBUG': JSON.stringify(env.VITE_CORS_DEBUG === 'true')
    }
  }
})
