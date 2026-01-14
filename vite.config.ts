import { defineConfig } from 'vite';

export default defineConfig({
  base: '/ifc/',
  
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  
  optimizeDeps: {
    exclude: ['web-ifc'],
  },
});
