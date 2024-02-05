import babel from '@rollup/plugin-babel'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import terser from '@rollup/plugin-terser'
console.log(`
-------------------------------------
Rollup building bundle for ${process.env.BABEL_ENV}
-------------------------------------
`)
const extensions = ['.js', '.ts']
export default {
  input: 'src/index.ts',
  output: [
    ...(process.env.BABEL_ENV === 'esmBundled'
      ? [
          {
            file: 'dist/bundles/apicore.min.mjs',
            format: 'esm',
            sourcemap: true,
            exports: 'auto'
          },
        ]
      : []),
    ...(process.env.BABEL_ENV === 'umdBundled'
      ? [
          {
            file: 'dist/bundles/apicore.min.js',
            format: 'umd',
            name: 'ApiCore',
            sourcemap: true,
            exports: 'default'
          },
        ]
      : []),
  ],
  plugins: [
    nodeResolve({
      browser: true,
      extensions
    }),
    commonjs(),
    json(),
    babel({
      babelHelpers: 'bundled',
      include: ['src/**/*.ts'],
      extensions,
      exclude: ['./node_modules/**', 'src/**/*.test.ts', 'src/test.ts'],
    }),
    nodePolyfills({
      include: null,
      sourceMap: true
    }),
    terser()
  ],
}