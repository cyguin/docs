import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    next: 'src/next.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  external: ['better-sqlite3', 'nanoid'],
});
