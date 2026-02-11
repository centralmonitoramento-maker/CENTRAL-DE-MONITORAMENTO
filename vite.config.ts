
import { defineConfig } from 'vite';
import { webcrypto } from 'node:crypto';

// Polyfill para garantir que o Vite 6 tenha acesso à API Crypto durante o build no Node.js
if (!globalThis.crypto) {
  // @ts-ignore
  globalThis.crypto = webcrypto;
}

export default defineConfig({
  base: './', // Essencial para o GitHub Pages (caminhos relativos)
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
});
