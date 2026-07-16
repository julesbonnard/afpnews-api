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
    // .mjs is unambiguously ESM by extension alone, so consumers/bundlers
    // don't need to fall back to the folder's package.json "type" field
    // (flagged by `tsdown --publint --attw`, which otherwise reports a
    // false-ESM/CJS mismatch on the plain .js output).
    outExtensions: () => ({ js: '.mjs', dts: '.d.mts' }),
  },
  {
    entry: libEntry,
    unbundle: true,
    format: ['cjs'],
    dts: true,
    sourcemap: true,
    outDir: 'dist/cjs',
    outExtensions: () => ({ js: '.cjs', dts: '.d.cts' }),
  },
  {
    entry: { 'bundles/apicore.min': 'src/index.ts' },
    format: ['esm'],
    platform: 'browser',
    target: 'es2020',
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
    target: 'es2020',
    deps: { alwaysBundle: [/.*/], onlyBundle: false },
    minify: true,
    sourcemap: true,
    dts: false,
    outputOptions: {
      entryFileNames: '[name].js',
    },
  },
])
