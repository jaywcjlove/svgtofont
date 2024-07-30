#!/usr/bin/env node

import FS from 'fs-extra';
import { Arguments } from 'yargs';
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import path from 'path';
import svgtofont from './index.js';
import { log } from './log.js';

type ArgvResult = Arguments<{
  sources: string;
  output: string;
  fontName: string;
}>

const argv = yargs(hideBin(process.argv))
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
  .argv as ArgvResult;

const sourcesPath = path.resolve(process.cwd(), argv.sources);
const outputPath = path.resolve(process.cwd(), argv.output);

if (!FS.pathExistsSync(sourcesPath)) {
  log.error('The directory does not exist!', sourcesPath);
  process.exit();
}

if (!FS.pathExistsSync(outputPath)) {
  FS.mkdirpSync(outputPath);
}

svgtofont({
  src: sourcesPath, // svg path
  dist: outputPath, // output path
  // emptyDist: true, // Clear output directory contents
  fontName: (argv.fontName) || "svgfont", // font name
  css: true, // Create CSS files.
  outSVGReact: true,
  outSVGReactNative: false,
  outSVGPath: true,
  svgicons2svgfont: {
    fontHeight: 1000,
    normalize: true,
  },
})
.then(() => {
  log.log('done!');
}).catch((err) => {
  log.log('SvgToFont:ERR:', err);
});
