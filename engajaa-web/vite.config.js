import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Dev local (Docker)
    host: '0.0.0.0',
    port: 5175,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Chunks separados para vendor e app — melhor cache no Vercel
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
  // Variáveis de ambiente disponíveis em import.meta.env
  // VITE_API_URL → definido no Vercel (produção) ou .env (local)
});
