
import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Necessário para carregar arquivos corretamente no GitHub Pages
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
