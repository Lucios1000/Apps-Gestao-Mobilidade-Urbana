import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// PWA plugin é carregado dinamicamente para evitar falhas locais sem dependência instalada

export default defineConfig(async ({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
    const basePath = isVercel ? '/' : (mode === 'production' ? '/Lucios1000-novos-apps/' : '/');
    const plugins: any[] = [react()];
    try {
      const { VitePWA } = await import('vite-plugin-pwa');
      plugins.push(
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['icon.svg'],
          devOptions: { enabled: true },
          manifest: {
            name: 'TKX Franca — Viabilidade Financeira',
            short_name: 'TKX Franca',
            start_url: basePath,
            scope: basePath,
            display: 'standalone',
            theme_color: '#0f172a',
            background_color: '#0b1220',
            icons: [
              { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
            navigateFallback: 'index.html'
          }
        })
      );
    } catch {}
    return {
      // Base dinâmica: '/' em Vercel; '/Lucios1000-novos-apps/' em produção GitHub Pages
      base: basePath,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
        preview: {
          port: 4174,
          host: '0.0.0.0',
        },
      plugins,
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              react: ['react', 'react-dom'],
              recharts: ['recharts'],
              xlsx: ['xlsx'],
              lucide: ['lucide-react']
            }
          }
        }
      }
    };
});
