import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(process.cwd(), 'index.html'),
        reviewGate: resolve(process.cwd(), 'forge/review-gate.html')
      }
    }
  }
});
