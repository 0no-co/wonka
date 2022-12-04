import { resolve, basename, dirname, join } from 'path';
import { writeFileSync } from 'fs';
import { compiler, beautify } from 'flowgen';

import glob from 'glob';

function flowTypings() {
  return {
    name: 'flow-typings',
    async writeBundle() {
      const cwd = process.cwd();
      for (const file of glob.sync('dist/types/**/*.d.ts')) {
        const fullpath = resolve(cwd, file);
        const flowdef = beautify(compiler.compileDefinitionFile(fullpath));
        const name = basename(fullpath, '.d.ts');
        const filepath = dirname(fullpath);
        const newpath = join(filepath, name + '.js.flow');
        const definition = flowdef.replace(/import/g, 'import type');
        writeFileSync(newpath, '// @flow\n\n' + definition);
      }
    },
  };
}

export default flowTypings;
