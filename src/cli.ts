#!/usr/bin/env node

import FS from 'fs-extra';
import yargs from 'yargs';
import path from 'path';
import svgtofont from './';

const argv = yargs
  .alias('s', 'sources')
  .describe('s', 'The root from which all sources are relative.')
  .alias('o', 'output')
  .describe('o', 'Output directory.')
  .alias('f', 'fontName')
  .describe('f', 'Font Name.')
  .demandOption(['output', 'sources'])
  .help('h')
  .alias('h', 'help')
  .epilog('copyright 2019')
  .argv;

const sourcesPath = path.join(process.cwd(), argv.sources as string);
const outputPath = path.join(process.cwd(), argv.output as string);

if (!FS.pathExistsSync(sourcesPath)) {
  console.error('The directory does not exist!', sourcesPath);
  process.exit();
}

if (!FS.pathExistsSync(outputPath)) {
  FS.mkdirpSync(outputPath);
}

svgtofont({
  src: sourcesPath, // svg path
  dist: outputPath, // output path
  // emptyDist: true, // Clear output directory contents
  fontName: (argv.fontName as string) || "svgfont", // font name
  css: true, // Create CSS files.
  outSVGReact: true,
  outSVGPath: true,
  svgicons2svgfont: {
    fontHeight: 1000,
    normalize: true,
  },
})
.then(() => {
  console.log('done!');
}).catch((err) => {
  console.log('SvgToFont:ERR:', err);
});
