import { defineConfig } from 'tsdown'

const libEntry = ['src/**/*.ts', '!src/**/*.test.ts', '!src/**/*.d.ts', '!src/types.ts', '!src/index-cjs.ts']

export default defineConfig([
  {
    entry: libEntry,
    unbundle: true,
    format: ['esm'],
    dts: true,
    sourcemap: true,
    outDir: 'dist/esm',
    outExtensions: () => ({ js: '.js', dts: '.d.mts' }),
  },
  {
    entry: libEntry,
    unbundle: true,
    format: ['cjs'],
    dts: true,
    sourcemap: true,
    outDir: 'dist/cjs',
    outExtensions: () => ({ js: '.js', dts: '.d.cts' }),
  },
  {
    entry: { 'bundles/apicore.min': 'src/index.ts' },
    format: ['esm'],
    platform: 'browser',
    deps: { alwaysBundle: [/.*/], onlyBundle: false },
    minify: true,
    sourcemap: true,
    dts: false,
    outputOptions: {
      entryFileNames: '[name].mjs',
    },
  },
  {
    entry: { 'bundles/apicore.min': 'src/index-cjs.ts' },
    format: ['umd'],
    globalName: 'ApiCore',
    platform: 'browser',
    deps: { alwaysBundle: [/.*/], onlyBundle: false },
    minify: true,
    sourcemap: true,
    dts: false,
    outputOptions: {
      entryFileNames: '[name].js',
    },
  },
])
