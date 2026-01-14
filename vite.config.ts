import { defineConfig } from 'vite';

export default defineConfig({
  // Für GitHub Pages: Repository-Name als base setzen
  // Ändere 'ifc-viewer' zu deinem Repository-Namen!
  base: '/ifc-viewer/',
  
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  
  optimizeDeps: {
    exclude: ['web-ifc'],
  },
  
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
