import { basename } from 'path';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import buble from 'rollup-plugin-buble';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';
import compiler from '@ampproject/rollup-plugin-closure-compiler';

const pkgInfo = require('./package.json');
const { main, peerDependencies, dependencies } = pkgInfo;
const name = basename(main, '.js');

let external = ['dns', 'fs', 'path', 'url'];
if (pkgInfo.peerDependencies) external.push(...Object.keys(peerDependencies));
if (pkgInfo.dependencies) external.push(...Object.keys(dependencies));

const externalPredicate = new RegExp(`^(${external.join('|')})($|/)`);
const externalTest = id => externalPredicate.test(id);

const terserPretty = terser({
  sourcemap: true,
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
});

const terserMinified = terser({
  sourcemap: true,
  warnings: true,
  ecma: 5,
  ie8: false,
  toplevel: true,
  mangle: true,
  compress: {
    keep_infinity: true,
    pure_getters: true,
    passes: 10
  },
  output: {
    comments: false
  }
});

const makePlugins = isProduction =>
  [
    nodeResolve({
      mainFields: ['module', 'jsnext', 'main'],
      browser: true
    }),
    commonjs({
      ignoreGlobal: true,
      include: /\/node_modules\//
    }),
    buble({
      transforms: {
        unicodeRegExp: false,
        dangerousForOf: true,
        dangerousTaggedTemplateString: true
      },
      objectAssign: 'Object.assign',
      exclude: 'node_modules/**'
    }),
    babel({
      babelrc: false,
      exclude: 'node_modules/**',
      presets: [],
      plugins: [['babel-plugin-closure-elimination', {}]]
    }),
    compiler({
      compilation_level: 'SIMPLE_OPTIMIZATIONS'
    }),
    isProduction ? terserMinified : terserPretty
  ].filter(Boolean);

const config = {
  input: './src/index.js',
  onwarn: () => {},
  external: externalTest,
  treeshake: {
    propertyReadSideEffects: false
  }
};

export default [
  {
    ...config,
    plugins: makePlugins(false),
    output: [
      {
        sourcemap: true,
        legacy: true,
        freeze: false,
        esModule: false,
        file: `./dist/${name}.js`,
        format: 'cjs'
      },
      {
        legacy: true,
        freeze: false,
        esModule: false,
        file: `./dist/${name}.es.js`,
        format: 'esm'
      }
    ]
  },
  {
    ...config,
    plugins: makePlugins(true),
    output: [
      {
        legacy: true,
        freeze: false,
        esModule: false,
        file: `./dist/${name}.min.js`,
        format: 'cjs'
      }
    ]
  }
];
