import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src/core'),
      '@ui': resolve(__dirname, 'src/ui'),
      '@platform': resolve(__dirname, 'src/platform'),
      '@store': resolve(__dirname, 'src/store'),
      '@types': resolve(__dirname, 'src/types')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx', 'tests/integration/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/core/**/*.ts', 'src/store/**/*.ts', 'src/platform/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.ts', 'src/ui/**/*', 'src/background/**/*', 'src/content/**/*', 'src/injected/**/*', 'src/sidepanel/**/*', 'src/popup/**/*', 'src/sidebar/**/*'],
      thresholds: {
        lines: 45,
        functions: 45,
        branches: 45,
        statements: 45
      }
    }
  }
});