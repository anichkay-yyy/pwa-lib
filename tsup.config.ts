import { defineConfig } from 'tsup'

export default defineConfig([
  // CLI bundle
  {
    entry: ['src/cli/index.ts'],
    outDir: 'dist/cli',
    format: ['esm'],
    target: 'node20',
    platform: 'node',
    banner: { js: '#!/usr/bin/env node' },
    clean: true,
    dts: false,
  },
  // Client library
  {
    entry: ['src/client/index.ts'],
    outDir: 'dist/client',
    format: ['esm'],
    target: 'es2022',
    platform: 'browser',
    dts: true,
    clean: false,
  },
  // Config/types export
  {
    entry: ['src/shared/index.ts'],
    outDir: 'dist/shared',
    format: ['esm'],
    target: 'node20',
    dts: true,
    clean: false,
  },
])
