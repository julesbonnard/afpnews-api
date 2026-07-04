import addImportExtensionLocal from './tools/babel-plugin-add-import-extension-local.mjs'

/**
 * Config fragments to be used by all module
 * format environments
 */
const sharedPresets = ['@babel/preset-typescript']
const sharedIgnoredFiles = ['src/**/*.test.ts', 'src/types.ts', 'src/index-cjs.ts']
const sharedConfig = {
  ignore: sharedIgnoredFiles,
  presets: sharedPresets,
}
/**
 * Shared configs for bundles (ESM and UMD)
 */
const bundlePresets = [
  '@babel/preset-env',
  ...sharedPresets,
]
const bundleConfig = {
  ...sharedConfig,
  presets: bundlePresets,
  plugins: [
    [
      'babel-plugin-polyfill-corejs3',
      {
        method: 'entry-global',
        version: '3.35.1',
      },
    ],
  ],
}
/**
 * Babel Config
 */
export default {
  env: {
    esmUnbundled: {
      ...sharedConfig,
      plugins: [addImportExtensionLocal]
    },
    esmBundled: bundleConfig,
    umdBundled: bundleConfig,
    cjs: {
      ignore: sharedIgnoredFiles,
      presets: [
        [
          '@babel/preset-env',
          {
            modules: 'commonjs',
          },
        ],
        ...sharedPresets,
      ]
    },
    test: {
      presets: ['@babel/preset-env', ...sharedPresets],
    },
  },
}
