import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node24',
  clean: true,
  loader: { '.tsx': 'tsx' },
  banner: {
    js: '#!/usr/bin/env node',
  },
})
