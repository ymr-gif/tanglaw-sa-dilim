import { defineConfig } from 'vite';

/**
 * `base: './'` so a built deck runs from a file path or any subdirectory.
 * The failsafe in CONTEXT.md §10 is "serve dist/ from the operator's machine" —
 * that must work without knowing the URL it will sit at.
 *
 * `assetsInlineLimit: 0` keeps mask.svg a real file rather than a data URI,
 * so it can be swapped for the final art without a rebuild of the JS bundle.
 */
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  server: {
    host: true,
  },
});
