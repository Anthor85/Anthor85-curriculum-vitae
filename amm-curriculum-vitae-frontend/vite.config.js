import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// `vite preview` no lee vercel.json: sin esto, en "/en" serviría dist/index.html
// (español) y no se podría probar la hidratación de dist/en/index.html.
const rewriteIngles = () => ({
  name: 'rewrite-en-preview',
  configurePreviewServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url === '/en' || req.url?.startsWith('/en?')) {
        req.url = req.url.replace('/en', '/en/index.html');
      }
      next();
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), rewriteIngles()],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use '/src/styles/variables' as v;`,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    include: ['test/**/*.test.tsx'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'vite-env.d.ts',
        'src/interfaces/**',
        'src/**/index.ts',
        'src/index.tsx',
        'src/entry-server.tsx',
        'src/router/**',
        'src/pages/Curriculum.tsx',
        'src/pages/components/**',
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 80,
      },
    },
  },
});
