import babel from '@rollup/plugin-babel'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import terser from '@rollup/plugin-terser'
import { dts } from 'rollup-plugin-dts'
import process from 'node:process'

import packageJson from './package.json' with { type: 'json' }

export default [
  ...process.env.BABEL_ENV === 'esmBundled' || process.env.BABEL_ENV === 'umdBundled' ? [{
    input: process.env.BABEL_ENV === 'umdBundled' ? 'src/index-cjs.ts' : 'src/index.ts',
    output: [
      ...process.env.BABEL_ENV === 'esmBundled' ? [{
        file: packageJson.exports['.'].browser.import.default,
        format: 'esm',
        sourcemap: true
      }] : [],
      ...process.env.BABEL_ENV === 'umdBundled' ? [{
        file: packageJson.exports['.'].browser.script,
        format: 'umd',
        name: 'ApiCore',
        sourcemap: true
      }] : [],
    ],
    plugins: [
      nodeResolve({
        browser: true,
        extensions: ['.js', '.ts']
      }),
      commonjs(),
      json(),
      babel({
        babelHelpers: 'bundled',
        include: ['src/**/*.ts'],
        extensions: ['.js', '.ts'],
        exclude: ['./node_modules/**', 'src/**/*.test.ts'],
      }),
      nodePolyfills({
        include: null,
        sourceMap: true
      }),
      terser()
    ]
  }] : 
  [{
    input: 'dist/types/index.d.ts',
    output: [
      {
        file: 'dist/cjs/index.d.cts',
        format: 'cjs'
      },
      {
        file: 'dist/esm/index.d.mts',
        format: 'es'
      }
    ],
    plugins: [dts()]
  }]
]
