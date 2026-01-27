import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // En build usamos rutas relativas para que dist/index.html funcione
  // al abrirse desde filesystem o dentro de un WebView.
  base: command === 'build' ? './' : '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    manifest: true,
    rollupOptions: {
      treeshake: {
        // Mantiene imports por efectos laterales (p.ej. hojas de estilo importadas).
        // Importante para que el build emita CSS y para que build-inline pueda inlinearlo.
        moduleSideEffects: true,
      },
      output: {
        manualChunks: undefined,
      },
    },
  },
}));
