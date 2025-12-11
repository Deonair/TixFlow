import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Gebruik Vite env vars zonder `any`
const API_URL = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_API_URL || 'http://localhost:5050';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': { target: API_URL, changeOrigin: true }
    }
  }
});
