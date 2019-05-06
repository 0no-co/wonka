import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import buble from 'rollup-plugin-buble';
import { terser } from 'rollup-plugin-terser';
import prettier from 'rollup-plugin-prettier';

const plugins = [
  nodeResolve({
    mainFields: ['module', 'jsnext', 'main'],
    browser: true
  }),
  commonjs({
    include: /\/node_modules\//
  }),
  buble({
    transforms: {
      dangerousForOf: true,
      dangerousTaggedTemplateString: true
    },
    objectAssign: 'Object.assign'
  }),
  terser({
    warnings: true,
    ecma: 5,
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
      join_vars: false
    },
    mangle: false,
    output: {
      beautify: true,
      braces: true,
      indent_level: 2
    }
  }),
  prettier({
    parser: 'babel',
    singleQuote: true,
    printWidth: 100
  })
];

const config = {
  input: './src/index.js',
  external: () => false,
  plugins,
  treeshake: {
    propertyReadSideEffects: false
  },
  output: [
    {
      legacy: true,
      freeze: false,
      esModule: false,
      file: './dist/wonka.js',
      format: 'cjs'
    },
    {
      legacy: true,
      freeze: false,
      esModule: false,
      file: './dist/wonka.es.js',
      format: 'esm'
    }
  ]
};

export default config;
