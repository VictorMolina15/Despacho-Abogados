import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, 
    proxy: {
      // Cualquier petición que empiece con '/api'
      '/api': {
        // La redirigimos a nuestro servidor de backend
        target: 'http://localhost:3000',
        // Necesario para que el backend acepte la petición
        changeOrigin: true,
      },
    }
  },
})
