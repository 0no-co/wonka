import { transformSync as transform } from '@babel/core';
import { createFilter } from 'rollup-pluginutils';

function unwrapStatePlugin({ types: t }) {
  return {
    pre() {
      this.props = new Map();
      this.test = (node) =>
        /state$/i.test(node.id.name) ||
        (node.init.properties.length === 1 && node.init.properties[0].key.name === 'contents');
    },
    visitor: {
      VariableDeclarator(path) {
        if (
          t.isIdentifier(path.node.id) &&
          t.isObjectExpression(path.node.init) &&
          path.node.init.properties.every(
            (prop) => t.isObjectProperty(prop) && t.isIdentifier(prop.key)
          ) &&
          this.test(path.node)
        ) {
          const id = path.node.id.name;
          const properties = path.node.init.properties;
          const propNames = new Set(properties.map((x) => x.key.name));
          const decl = properties.map((prop) => {
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
      },
    },
  };
}

function curryGuaranteePlugin({ types: t }) {
  const curryFnName = /^_(\d)$/;
  const lengthId = t.identifier('length');
  const bindId = t.identifier('bind');

  return {
    visitor: {
      CallExpression(path) {
        if (!t.isIdentifier(path.node.callee) || !curryFnName.test(path.node.callee.name)) {
          return;
        }

        const callFn = path.node.arguments[0];
        const callArgs = path.node.arguments.slice(1);

        // Check whether the value of the call is unused
        if (t.isExpressionStatement(path.parent)) {
          path.replaceWith(t.callExpression(callFn, callArgs));
          return;
        }

        // Check whether the callee is a local function definition whose arity matches
        if (t.isIdentifier(callFn) && path.scope.hasBinding(callFn.name)) {
          const callFnDefinition = path.scope.getBinding(callFn.name).path.node;
          if (
            t.isFunctionDeclaration(callFnDefinition) &&
            callFnDefinition.params.length === callArgs.length
          ) {
            path.replaceWith(t.callExpression(callFn, callArgs));
            return;
          }
        }

        // Special case since sources don't return any value
        if (
          t.isIdentifier(callFn) &&
          callFn.name === 'source' &&
          t.isReturnStatement(path.parent)
        ) {
          path.replaceWith(t.callExpression(callFn, callArgs));
          return;
        }

        const arityLiteral = t.numericLiteral(callArgs.length);
        const argIds = callArgs.map((init) => {
          if (t.isIdentifier(init)) return init;
          const id = path.scope.generateUidIdentifierBasedOnNode(path.node.id);
          path.scope.push({ id, init });
          return id;
        });

        path.replaceWith(
          t.conditionalExpression(
            t.binaryExpression('===', t.memberExpression(callFn, lengthId), arityLiteral),
            t.callExpression(callFn, argIds),
            t.callExpression(t.memberExpression(callFn, bindId), [t.nullLiteral()].concat(argIds))
          )
        );
      },
    },
  };
}

function squashImplicitUnitReturn({ types: t }) {
  return {
    visitor: {
      ReturnStatement(path) {
        if (
          t.isCallExpression(path.node.argument) &&
          t.isIdentifier(path.node.argument.callee) &&
          (path.node.argument.callee.name === 'sink' || path.node.argument.callee.name === 'source')
        ) {
          path.replaceWithMultiple([
            t.expressionStatement(path.node.argument),
            t.returnStatement(),
          ]);
        }
      },
      Function: {
        exit(functionPath) {
          if (t.isIdentifier(functionPath.id) && functionPath.id.name === 'valFromOption') return;

          let hasEmptyReturn = false;
          let hasCallReturnOnly = true;
          functionPath.traverse({
            Function(innerPath) {
              innerPath.skip();
            },
            ReturnStatement: {
              enter(path) {
                if (path.node.argument === null) {
                  hasEmptyReturn = true;
                } else if (!t.isCallExpression(path.node.argument)) {
                  hasCallReturnOnly = false;
                }
              },
              exit(path) {
                if (hasEmptyReturn && hasCallReturnOnly && path.node.argument !== null) {
                  path.replaceWithMultiple([
                    t.expressionStatement(path.node.argument),
                    t.returnStatement(),
                  ]);
                }
              },
            },
          });
        },
      },
    },
  };
}

function cleanup(opts = {}) {
  const filter = createFilter(opts.include, opts.exclude, {
    resolve: false,
  });

  return {
    name: 'minifyBucklescript',

    renderChunk(code, chunk) {
      if (!filter(chunk.fileName)) {
        return null;
      }

      return transform(code, {
        plugins: [unwrapStatePlugin, curryGuaranteePlugin, squashImplicitUnitReturn],
        babelrc: false,
      });
    },
  };
}

export default cleanup;
