import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
  // Cloudflare Pages deployment
  base: '/',
  server: {
    port: 3002,
    proxy: {
      '/api': {
        target: 'https://erp.mte.vn',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Strip both 'expect' and 'Expect' — needed for ERPNext POST /api/method/
            proxyReq.removeHeader('expect');
            // Also remove via setHeader empty to be extra safe
            try { proxyReq.setHeader('expect', ''); } catch { /* already removed */ }
          });
        },
      },
    },
  },
});