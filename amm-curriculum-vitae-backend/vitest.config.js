const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    environment: 'node',
    globals: true,
    globalSetup: './test/globalSetup.js',
    setupFiles: './test/setup.js',
    include: ['test/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'controllers/**',
        'middlewares/**',
        'helpers/**',
        'models/**',
        'database/config.js',
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
