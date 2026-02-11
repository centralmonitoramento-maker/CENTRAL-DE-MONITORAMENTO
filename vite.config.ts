
import { defineConfig, loadEnv } from 'vite';
import { webcrypto } from 'node:crypto';

// Polyfill para garantir que o Vite 6 tenha acesso à API Crypto durante o build no Node.js
if (!globalThis.crypto) {
  // @ts-ignore
  globalThis.crypto = webcrypto;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: './',
    define: {
      // Injeta variáveis individualmente e o objeto process completo
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env': JSON.stringify({
        ...env,
        NODE_ENV: mode
      })
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-ai': ['@google/genai']
          },
        },
      },
    },
    server: {
      host: true,
      port: 3000,
      strictPort: true,
    }
  };
});
