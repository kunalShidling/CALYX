import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      // Proxy matching Kubernetes Ingress paths to local microservices
      '/api/v1/auth': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/api/v1/jobs': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/api/v1/applications': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/api/v1/resumes': {
        target: 'http://localhost:8003',
        changeOrigin: true,
      },
      '/api/v1/agents': {
        target: 'http://localhost:8004',
        changeOrigin: true,
      },
      '/api/v1/analytics': {
        target: 'http://localhost:8005',
        changeOrigin: true,
      },
    },
  },
});
