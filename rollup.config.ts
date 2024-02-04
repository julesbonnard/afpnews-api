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
            file: 'dist/bundles/apicore.esm.min.js',
            format: 'esm',
            sourcemap: true,
          },
        ]
      : []),
    ...(process.env.BABEL_ENV === 'umdBundled'
      ? [
          {
            file: 'dist/bundles/apicore.umd.min.js',
            format: 'umd',
            name: 'ApiCore',
            sourcemap: true,
          },
        ]
      : []),
  ],
  plugins: [
    nodeResolve({ extensions }),
    commonjs(),
    json(),
    babel({
      babelHelpers: 'bundled',
      include: ['src/**/*.ts'],
      extensions,
      exclude: ['./node_modules/**', 'src/**/*.test.ts', 'src/test.ts'],
    }),
    nodePolyfills(),
    terser(),
  ],
}