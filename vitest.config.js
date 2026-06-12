import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // Default to node env; tests that need DOM opt-in with @vitest-environment happy-dom
    // pragma at the top of the file.
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.js'],
  },
});
