import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite dev server proxies /api/* to the backend so cookies are same-origin in dev — no
 * CORS dance, no second domain for the browser to track. In prod, the same-origin
 * assumption holds because the SPA is served by the API (or behind a path-merging
 * reverse proxy).
 *
 * `build.rollupOptions.output.manualChunks` splits the bundle by dependency family so
 * the user doesn't re-download AntD every time we change app code. Splitting "vendor"
 * further into React+react-dom (changes rarely) and AntD+icons (changes a touch more
 * often) keeps the long-term cache bite small for users who return to the dashboard
 * after a minor deploy.
 *
 * Alternative: dynamic `import()` per route. Rejected for now — the role subtrees are
 * three pages each and load fast enough at our page count; routing-level splitting
 * would add a code complexity (per-route Suspense) that we don't need until bundle size
 * crosses ~2 MB unminified.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5050',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-core': ['react', 'react-dom', 'react-router-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          antd: ['antd', '@ant-design/icons', 'dayjs'],
        },
      },
    },
  },
});
