import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Avoid direct `process` ref to prevent TS Node types error
const API_URL = (globalThis as any)?.process?.env?.VITE_API_URL || 'http://localhost:5050';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: API_URL, changeOrigin: true }
    }
  }
});
