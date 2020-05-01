import { resolve, basename } from 'path';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import buble from '@rollup/plugin-buble';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';
import compiler from '@ampproject/rollup-plugin-closure-compiler';

import minifyBucklescript from './scripts/minify-bucklescript-plugin';

const cwd = process.cwd();
const pkgInfo = require('./package.json');
const name = basename(pkgInfo.main, '.js');

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
    join_vars: false,
  },
  mangle: false,
  output: {
    beautify: true,
    braces: true,
    indent_level: 2,
  },
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
    passes: 10,
  },
  output: {
    comments: false,
  },
});

const importAllPlugin = ({ types: t }) => ({
  visitor: {
    VariableDeclarator(path) {
      if (
        t.isIdentifier(path.node.id) &&
        t.isCallExpression(path.node.init) &&
        t.isIdentifier(path.node.init.callee) &&
        path.node.init.callee.name === 'require' &&
        path.node.init.arguments.length === 1
      ) {
        path.parentPath.replaceWith(
          t.importDeclaration(
            [t.importNamespaceSpecifier(path.node.id)],
            path.node.init.arguments[0]
          )
        );
      }
    },
  },
});

const makePlugins = (isProduction) =>
  [
    babel({
      babelrc: false,
      extensions: ['ts', 'tsx', 'js'],
      exclude: 'node_modules/**',
      presets: [],
      plugins: ['@babel/plugin-syntax-typescript', importAllPlugin],
    }),
    typescript({
      typescript: require('typescript'),
      cacheRoot: './node_modules/.cache/.rts2_cache',
      useTsconfigDeclarationDir: true,
      tsconfigOverride: {
        compilerOptions: {
          strict: false,
          noUnusedParameters: false,
          declaration: !isProduction,
          declarationDir: resolve(cwd, './dist/types/'),
          target: 'esnext',
          module: 'es2015',
          rootDir: cwd,
        },
      },
    }),
    commonjs({
      ignoreGlobal: true,
      include: ['*', '**'],
      extensions: ['.js', '.ts', '.tsx'],
    }),
    nodeResolve({
      mainFields: ['module', 'jsnext', 'main'],
      extensions: ['.js', '.ts', '.tsx'],
      browser: true,
    }),
    buble({
      transforms: {
        unicodeRegExp: false,
        dangerousForOf: true,
        dangerousTaggedTemplateString: true,
      },
      objectAssign: 'Object.assign',
      exclude: 'node_modules/**',
    }),
    babel({
      babelrc: false,
      extensions: ['ts', 'tsx', 'js'],
      exclude: 'node_modules/**',
      presets: [],
      plugins: ['babel-plugin-closure-elimination'],
    }),
    minifyBucklescript(),
    compiler({
      formatting: 'PRETTY_PRINT',
      compilation_level: 'SIMPLE_OPTIMIZATIONS',
    }),
    isProduction ? terserMinified : terserPretty,
  ].filter(Boolean);

const config = {
  input: './src/Wonka.ts',
  onwarn: () => {},
  external: () => false,
  treeshake: {
    propertyReadSideEffects: false,
  },
};

export default [
  {
    ...config,
    plugins: makePlugins(false),
    output: [
      {
        legacy: true,
        freeze: false,
        esModule: false,
        file: `./dist/${name}.js`,
        format: 'cjs',
      },
      {
        compact: true,
        file: `./dist/${name}.mjs`,
        format: 'esm',
      },
    ],
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
        format: 'cjs',
      },
    ],
  },
];
