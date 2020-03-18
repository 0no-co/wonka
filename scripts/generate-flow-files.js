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

const cwd = process.cwd();
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const preamble = '// @flow\n\n';

const genEntry = async () => {
  try {
    fs.mkdirSync(path.resolve(cwd, 'dist'));
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }

  let entry = await readFile(path.resolve(cwd, 'index.js.flow'), { encoding: 'utf8' });

  entry = entry.replace(/.\/dist\//g, './');

  const outputCJS = path.resolve(cwd, 'dist/wonka.js.flow');
  const outputES = path.resolve(cwd, 'dist/wonka.mjs.flow');

  return Promise.all([
    writeFile(outputCJS, entry, { encoding: 'utf8' }),
    writeFile(outputES, entry, { encoding: 'utf8' })
  ]);
};

const gen = async () => {
  const input = await globby('dist/types/**/*.d.ts');
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
    const definition = flowdef.replace(/import/g, 'import type');
    return writeFile(newpath, preamble + definition);
  });

  return Promise.all([...write, genEntry()]);
};

gen()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error(err.message);
    process.exit(1);
  });
