import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // Asegura que las rutas sean relativas al dominio raíz
  build: {
    rollupOptions: {
      input: '/index.html',
    },
  },
  server: {
    historyApiFallback: true, // Sirve index.html para rutas no encontradas
  },
});
