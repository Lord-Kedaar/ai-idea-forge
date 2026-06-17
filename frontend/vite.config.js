import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: true,
    proxy: {
      // Backend API — wszystkie endpointy są pod /api/*
      '/api': {
        target: 'http://localhost:3210',
        changeOrigin: true,
        secure: false,
      },
      // /health jest na backendzie pod rootem (nie pod /api)
      // Vite dev musi go też proksować bo inaczej zwraca SPA fallback
      '/health': {
        target: 'http://localhost:3210',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
