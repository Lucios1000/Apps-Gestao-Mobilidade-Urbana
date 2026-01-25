import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(async ({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const plugins: any[] = [react()];
    
    try {
      const { VitePWA } = await import('vite-plugin-pwa');
      plugins.push(
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['icon.svg'],
          devOptions: { enabled: false },
          manifest: {
            // Identidade v.6: Nome traduzido com original em parênteses
            name: 'Painel de Viabilidade Financeira v.6 (TKX Franca — Financial Viability v.6)',
            short_name: 'TKX v.6',
            // AJUSTE FINAL: Sincronizado com o nome real do repositório no GitHub
            start_url: '/App-tkx-Franca/',
            scope: '/App-tkx-Franca/',
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
    } catch (err) {
      console.log("PWA Plugin não carregado:", err);
    }

    return {
      // AJUSTE FINAL: Base de produção agora aponta para App-tkx-Franca
      base: mode === 'production' ? '/App-tkx-Franca/' : '/',
      server: {
        port: 3001,
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