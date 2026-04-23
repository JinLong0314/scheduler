import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          navigateFallback: '/index.html',
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === 'document',
              handler: 'NetworkFirst',
            },
            {
              urlPattern: ({ request }) =>
                ['script', 'style', 'worker', 'image', 'font'].includes(request.destination),
              handler: 'StaleWhileRevalidate',
            },
          ],
        },
        manifest: {
          name: 'Kairo',
          short_name: 'Kairo',
          description: '跨平台日程与任务管理',
          theme_color: '#E8956A',
          background_color: '#FAF3E8',
          display: 'standalone',
          start_url: '/',
          icons: [],
        },
      }),
    ],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_URL ?? 'http://127.0.0.1:8787',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ''),
        },
      },
    },
  };
});
