import { defineConfig } from 'vitest/config';
import ViteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts'],
    sequence: {
      concurrent: true,
      hooks: 'list',
    },
    poolOptions: {
      threads: {
        // isolate: true,
        // singleThread: true,
        useAtomics: true,
      },
    },
  },
  plugins: [ViteTsconfigPaths()],
});
