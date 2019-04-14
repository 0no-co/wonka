#!/usr/bin/env node

// This CLI generates .js.flow definitions from .d.ts
// TS definitions.
// It accepts files to generate definitions for via
// argv;

const path = require('path');
const fs = require('fs');
const globby = require('globby');

const { promisify } = require('util');
const { compiler, beautify } = require('flowgen');

const writeFile = promisify(fs.writeFile);
const preamble = '// @flow\n\n';

const gen = async () => {
  const cwd = process.cwd();

  const input = await globby([
    'src/*.d.ts',
    'src/**/*.d.ts'
  ], {
    gitignore: true
  });

  if (input.length === 0) {
    throw new Error('No input files passed as arguments.');
  }

  console.log(`Compiling ${input.length} TS definitions to Flow...`);

  const defs = input.map(filename => {
    const fullpath = path.resolve(cwd, filename);
    const flowdef = beautify(compiler.compileDefinitionFile(fullpath));
    return { fullpath, flowdef };
  });

  const write = defs.map(({ fullpath, flowdef }) => {
    const basename = path.basename(fullpath, '.d.ts');
    const filepath = path.dirname(fullpath);
    const newpath = path.join(filepath, basename + '.js.flow');

    return writeFile(newpath, preamble + flowdef, {
      encoding: 'utf8'
    });
  });

  return Promise.all(write);
};

gen().then(() => {
  process.exit(0);
}).catch(err => {
  console.error(err.message);
  process.exit(1);
});
