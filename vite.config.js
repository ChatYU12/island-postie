import { defineConfig } from 'vite';

// base './' keeps every asset URL relative, so the build works both at
// https://<user>.github.io/island-postie/ and when served from any folder.
export default defineConfig({
  base: './',
  build: { target: 'es2019', chunkSizeWarningLimit: 4096 }
});
