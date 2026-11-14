import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:5026';
  const proxy: Record<string, { target: string; changeOrigin: boolean }> = {
    '/api': { target: apiTarget, changeOrigin: true },
  };
  if (env.VITE_DOCS_TARGET) {
    proxy['/docs'] = { target: env.VITE_DOCS_TARGET, changeOrigin: true };
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: [
        '.trycloudflare.com',
        'tandem.unionmixteca.mx',
        '.unionmixteca.mx'
      ],
      proxy,
    },
  };
})