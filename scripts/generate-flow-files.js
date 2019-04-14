#!/usr/bin/env node

// This CLI generates .js.flow definitions from .d.ts
// TS definitions.
// It accepts files to generate definitions for via
// argv;

const path = require('path');
const fs = require('fs');
const meow = require('meow');
const ignore = require('ignore');

const { promisify } = require('util');
const { compiler, beautify } = require('flowgen');

const writeFile = promisify(fs.writeFile);
const cwd = process.cwd();
const preamble = '// @flow\n\n';
const cli = meow();
const ig = ignore();

let input = cli.input.slice().map(x => path.relative(cwd, x));

const gitignorePath = path.resolve(cwd, '.gitignore');

let gitignoreContents;
try {
  gitignoreContents = fs.readFileSync(gitignorePath).toString();
} catch (_error) {}

if (gitignoreContents) {
  console.log('Found gitignore file.');
  ig.add(gitignoreContents);
  input = ig.filter(input);
}

if (input.length === 0) {
  console.error('No input files passed as arguments.');
  process.exit(1);
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

Promise.all(write).then(() => {
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
