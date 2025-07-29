import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import terser from '@rollup/plugin-terser'
import { dts } from 'rollup-plugin-dts'
import typescript from '@rollup/plugin-typescript';
import packageJson from './package.json' with { type: 'json' }

const addJsExtension = () => ({
  name: 'add-js-extension',
  renderChunk(code) {
    return code.replace(/(import|export)(.*from ')(.\/.*)(')/g, `$1$2$3.js$4`);
  },
});

export default [
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist/esm',
      format: 'esm',
      sourcemap: true,
      plugins: [addJsExtension()],
      entryFileNames: 'index.js',
    },
    plugins: [
      typescript({
        declaration: true,
        declarationDir: 'dist/esm',
      }),
      nodeResolve(),
      commonjs(),
      json(),
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist/cjs',
      format: 'cjs',
      sourcemap: true,
      entryFileNames: 'index.js',
    },
    plugins: [
      typescript(),
      nodeResolve(),
      commonjs(),
      json(),
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      file: packageJson.exports['.'].browser.import.default,
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      typescript(),
      nodeResolve({ browser: true }),
      commonjs(),
      json(),
      nodePolyfills({ include: null, sourceMap: true }),
      terser(),
    ],
  },
  {
    input: 'src/index-cjs.ts',
    output: {
      file: packageJson.exports['.'].browser.script,
      format: 'umd',
      name: 'ApiCore',
      sourcemap: true,
    },
    plugins: [
      typescript(),
      nodeResolve({ browser: true }),
      commonjs(),
      json(),
      nodePolyfills({ include: null, sourceMap: true }),
      terser(),
    ],
  },
  {
    input: 'dist/esm/index.d.ts',
    output: [
      {
        file: 'dist/cjs/index.d.cts',
        format: 'cjs',
      },
      {
        file: 'dist/esm/index.d.mts',
        format: 'es',
      },
    ],
    plugins: [dts()],
  },
];
