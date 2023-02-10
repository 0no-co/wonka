import { compiler, beautify } from 'flowgen';

function flowTypings() {
  return {
    name: 'flow-typings',
    async renderChunk(code, chunk) {
      if (chunk.fileName.endsWith('d.ts')) {
        let flowdef = compiler.compileDefinitionString(code);

        flowdef = beautify(flowdef);
        flowdef = flowdef.replace(/import/g, 'import type');
        flowdef = `// @flow\n\n${flowdef}`;

        this.emitFile({
          type: 'asset',
          name: chunk.name,
          fileName: `${chunk.name}.js.flow`,
          source: flowdef,
        });
      }

      return null;
    },
  };
}

export default flowTypings;
