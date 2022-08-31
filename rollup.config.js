import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import buble from '@rollup/plugin-buble';
import { terser } from 'rollup-plugin-terser';

import flowTypings from './scripts/flow-typings-plugin';

const plugins = [
  resolve({
    extensions: ['.mjs', '.js', '.ts'],
    mainFields: ['module', 'jsnext', 'main'],
    preferBuiltins: false,
    browser: true,
  }),

  commonjs({
    ignoreGlobal: true,
    include: /\/node_modules\//,
    extensions: ['.mjs', '.js', '.ts'],
  }),

  typescript({
    typescript: require('typescript'),
    exclude: ['src/**/*.test.ts', '**/__tests__/*'],
    compilerOptions: {
      sourceMap: true,
      noEmit: false,
      declaration: true,
      declarationDir: './dist/types/',
      target: 'esnext',
    },
  }),

  flowTypings(),

  buble({
    transforms: {
      unicodeRegExp: false,
      defaultParameter: false,
      dangerousForOf: true,
      dangerousTaggedTemplateString: true,
      destructuring: false,
      asyncAwait: false,
      arrow: false,
      classes: false,
      computedProperty: false,
      conciseMethodProperty: false,
      templateString: false,
      objectRestSpread: false,
      parameterDestructuring: false,
      spreadRest: false,
    },
    exclude: 'node_modules/**',
  }),

  terser({
    warnings: true,
    ecma: 2015,
    keep_fnames: true,
    ie8: false,
    compress: {
      pure_getters: true,
      toplevel: true,
      booleans_as_integers: false,
      keep_fnames: true,
      keep_fargs: true,
      if_return: false,
      ie8: false,
      sequences: false,
      loops: false,
      conditionals: false,
      join_vars: false,
    },
    mangle: {
      module: true,
      keep_fnames: true,
    },
    output: {
      beautify: true,
      braces: true,
      indent_level: 2,
    },
  }),
];

const output = format => {
  const extension = format === 'esm' ? '.mjs' : '.js';
  return {
    chunkFileNames: '[hash]' + extension,
    entryFileNames: '[name]' + extension,
    dir: './dist',
    exports: 'named',
    sourcemap: true,
    indent: false,
    freeze: false,
    strict: false,
    format,
    // NOTE: All below settings are important for cjs-module-lexer to detect the export
    // When this changes (and terser mangles the output) this will interfere with Node.js ESM intercompatibility
    esModule: format !== 'esm',
    externalLiveBindings: format !== 'esm',
    generatedCode: {
      preset: 'es5',
      reservedNamesAsProps: false,
      objectShorthand: false,
      constBindings: false,
    },
  };
};

const config = {
  input: {
    wonka: './src/index.ts',
  },
  onwarn: () => {},
  external: () => false,
  plugins,
  treeshake: {
    unknownGlobalSideEffects: false,
    tryCatchDeoptimization: false,
    moduleSideEffects: false,
  },
  output: [output('esm'), output('cjs')],
};

export default config;
