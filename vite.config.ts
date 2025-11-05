import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:4000',
            changeOrigin: true,
            secure: false,
            // 在开发环境中注入API密钥
            configure: (proxy, options) => {
              proxy.on('proxyReq', (proxyReq, req, res) => {
                proxyReq.setHeader('x-api-key', 'dev-secret-key-12345');
              });
            }
          }
        }
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'prompt',
          includeAssets: ['icon/*.png', 'icon/*.ico'],
          manifest: {
            name: 'FocusFlow: Task & Time Analyzer',
            short_name: 'FocusFlow',
            description: '专注时间管理应用，帮助你更好地管理任务和时间',
            theme_color: '#4f46e5',
            background_color: '#4f46e5',
            display: 'standalone',
            scope: '/',
            start_url: '/',
            orientation: 'portrait-primary',
            icons: [
              {
                src: '/icon/pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icon/pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icon/maskable-icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ]
          },
          workbox: {
            // 轻量级配置，仅用于PWA安装，不做复杂缓存
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/aistudiocdn\.com\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'cdn-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 7 // 7 天
                  }
                }
              }
            ],
            navigateFallback: null,
            cleanupOutdatedCaches: true
          },
          devOptions: {
            enabled: false // 开发环境不启用SW，避免调试困扰
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'import.meta.env.VITE_LOGIN_USERNAME': JSON.stringify(env.VITE_LOGIN_USERNAME),
        'import.meta.env.VITE_LOGIN_PASSWORD': JSON.stringify(env.VITE_LOGIN_PASSWORD)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
