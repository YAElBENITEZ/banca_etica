// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   server: {
//     host: '0.0.0.0',
//     allowedHosts: ['.trycloudflare.com'],
//     proxy: {
//       '/api': {
//         target: 'http://localhost:5026',
//         changeOrigin: true,
//       },
//     },
//   },
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['.trycloudflare.com'],
    hmr: {
      clientPort: 443, // Permite que el WebSocket de HMR funcione sobre el túnel HTTPS
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5026',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
