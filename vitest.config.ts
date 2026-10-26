import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Node 25+ ships a global localStorage that shadows jsdom's and is undefined
// without --localstorage-file. Older Node versions reject the flag.
const NODE_MAJOR = Number(process.versions.node.split('.')[0]);
const WEBSTORAGE_EXEC_ARGV = NODE_MAJOR >= 25 ? ['--no-webstorage'] : [];

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [resolve(__dirname, 'src/web/test-setup.ts')],
    include: ['src/web/**/*.test.{ts,tsx}'],
    execArgv: WEBSTORAGE_EXEC_ARGV,
  },
});
