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

// Convert unsubscribe objects to tupels
const legacyUnsubscribePlugin = ({ types: t }) => ({
  visitor: {
    ObjectExpression(path) {
      if (
        path.node.properties.length === 1 &&
        t.isIdentifier(path.node.properties[0].key) &&
        path.node.properties[0].key.name === 'unsubscribe'
      ) {
        const value = path.node.properties[0].value;
        path.replaceWith(t.arrayExpression([value]));
      }
    },
    MemberExpression(path, state) {
      if (
        t.isCallExpression(path.parent) &&
        t.isIdentifier(path.node.property) &&
        path.node.property.name === 'unsubscribe'
      ) {
        path.node.property = t.numericLiteral(0);
      }
    }
  }
});

// Convert subjects and observers to tupels
const legacyObserverPlugin = ({ types: t }) => ({
  pre() {
    this.props = new Set(['source', 'next', 'complete']);
  },
  visitor: {
    ObjectExpression(path) {
      if (
        path.node.properties.length &&
        path.node.properties.every(
          x => t.isObjectProperty(x) && t.isIdentifier(x.key) && this.props.has(x.key.name)
        )
      ) {
        path.replaceWith(t.arrayExpression(path.node.properties.map(x => x.value)));
      }
    }
  }
});

// This plugin finds state that BuckleScript has compiled to an object
// and unwraps them into inline variables
const unwrapStatePlugin = ({ types: t }) => ({
  pre() {
    this.props = new Map();
  },
  visitor: {
    VariableDeclarator(path) {
      if (
        t.isIdentifier(path.node.id) &&
        t.isObjectExpression(path.node.init) &&
        path.node.init.properties.every(t.isObjectProperty)
      ) {
        const id = path.node.id.name;
        const properties = path.node.init.properties;
        const propNames = new Set(properties.map(x => x.key.name));
        const decl = properties.map(prop => {
          const key = `${id}$${prop.key.name}`;
          return t.variableDeclarator(t.identifier(key), prop.value);
        });

        this.props.set(id, propNames);
        path.parentPath.replaceWithMultiple(t.variableDeclaration('let', decl));
      }
    },
    MemberExpression(path) {
      if (
        t.isIdentifier(path.node.object) &&
        this.props.has(path.node.object.name) &&
        t.isIdentifier(path.node.property) &&
        this.props.get(path.node.object.name).has(path.node.property.name)
      ) {
        const id = path.node.object.name;
        const propName = path.node.property.name;
        path.replaceWith(t.identifier(`${id}$${propName}`));
      }
    }
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
      plugins: [
        'babel-plugin-closure-elimination',
        legacyUnsubscribePlugin,
        legacyObserverPlugin,
        unwrapStatePlugin
      ]
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
