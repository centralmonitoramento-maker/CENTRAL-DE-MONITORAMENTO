
import { defineConfig, loadEnv } from 'vite';
import { webcrypto } from 'node:crypto';

// Polyfill para garantir que o Vite 6 tenha acesso à API Crypto durante o build no Node.js
if (!globalThis.crypto) {
  // @ts-ignore
  globalThis.crypto = webcrypto;
}

export default defineConfig(({ mode }) => {
  // Fix: Property 'cwd' does not exist on type 'Process'.
  // Using type assertion to any to access the Node.js process.cwd() method.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    base: './', // Essencial para o GitHub Pages (caminhos relativos)
    define: {
      // Injeta a API_KEY para que o código 'process.env.API_KEY' funcione no navegador
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      // Garante que o objeto process não falhe se acessado
      'process.env': {
        NODE_ENV: JSON.stringify(mode),
        API_KEY: JSON.stringify(env.API_KEY || '')
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
    server: {
      host: true,
      strictPort: true,
    }
  };
});
