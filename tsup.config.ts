import { defineConfig } from 'tsup'

// @samline/internal is a devDependency bundled into every
// build (noExternal), so @samline/theme ships with no runtime dependencies.
const noExternal = [/^@samline\//]

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      'vanilla/index': 'src/vanilla/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: { resolve: noExternal },
    sourcemap: true,
    clean: true,
    target: 'es2020',
    treeshake: true,
    noExternal,
  },
  {
    entry: { 'browser/theme': 'src/browser/global.ts' },
    format: ['iife'],
    minify: true,
    sourcemap: true,
    clean: false,
    target: 'es2020',
    platform: 'browser',
    noExternal,
    outExtension: () => ({ js: '.global.js' }),
  },
])
