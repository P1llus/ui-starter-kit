import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

export default defineConfig({
  plugins: [
    // Must run before the React plugin. Generates src/routeTree.gen.ts and
    // code-splits each route's component into its own chunk.
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    // Emotion's JSX runtime enables the `css` prop on any element.
    react({ jsxImportSource: '@emotion/react' }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  worker: {
    format: 'es',
  },
  build: {
    // EUI is large; the default 500 kB warning is noise for a prototype.
    chunkSizeWarningLimit: 4000,
  },
});
