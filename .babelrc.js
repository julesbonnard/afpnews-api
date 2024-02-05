/**
 * Config fragments to be used by all module
 * format environments
 */
const sharedPresets = ['@babel/preset-typescript']
const sharedIgnoredFiles = ['src/**/*.test.ts']
const sharedConfig = {
  ignore: sharedIgnoredFiles,
  presets: sharedPresets,
}
/**
 * Shared configs for bundles (ESM and UMD)
 */
const bundlePresets = [
  [
    '@babel/preset-env',
    {
      useBuiltIns: "entry",
      corejs: "3.35.1"
    },
  ],
  ...sharedPresets,
]
const bundleConfig = {
  ...sharedConfig,
  presets: bundlePresets,
}
/**
 * Babel Config
 */
module.exports = {
  env: {
    esmUnbundled: {
      ...sharedConfig,
      plugins: ["babel-plugin-add-import-extension"]
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
      ],
      plugins: ["add-module-exports"]
    },
    test: {
      presets: ['@babel/preset-env', ...sharedPresets],
    },
  },
}
