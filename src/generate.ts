import fs from 'fs-extra';
import path from 'path';
import { optimize, OptimizedSvg } from 'svgo';
import { filterSvgFiles } from './utils';
import { SvgToFontOptions } from './';

/**
 * Generate Icon SVG Path Source
 * <font-name>.json
 */
export async function generateIconsSource(options: SvgToFontOptions = {}){
  const ICONS_PATH = filterSvgFiles(options.src)
  const data = await buildPathsObject(ICONS_PATH, options);
  const outPath = path.join(options.dist, `${options.fontName}.json`);
  await fs.outputFile(outPath, `{${data}\n}`);
  return outPath;
}

/**
 * Loads SVG file for each icon, extracts path strings `d="path-string"`,
 * and constructs map of icon name to array of path strings.
 * @param {array} files
 */
async function buildPathsObject(files: string[], options: SvgToFontOptions = {}) {
  const svgoOptions = options.svgoOptions || {};
  return Promise.all(
    files.map(async filepath => {
      const name = path.basename(filepath, '.svg');
      const svg = fs.readFileSync(filepath, 'utf-8');
      const pathStrings = optimize(svg, {
        path: filepath,
        ...options,
        plugins: [
          'convertTransform',
          ...(svgoOptions.plugins || [])
          // 'convertShapeToPath'
        ],
      }) as OptimizedSvg;
      const str: string[] = (pathStrings.data.match(/ d="[^"]+"/g) || []).map(s => s.slice(3));
      return `\n"${name}": [${str.join(',\n')}]`;
    }),
  );
}

const reactSource = (name: string, source: string) => `import React from 'react';
export const ${name} = props => (
  <svg viewBox="0 0 20 20" width="20" height="20" {...props}>${source}</svg>
);
`;

const reactTypeSource = (name: string) => `import React from 'react';
export declare const ${name}: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
`;

/**
 * Generate React Icon
 * <font-name>.json
 */
export async function generateReactIcons(options: SvgToFontOptions = {}) {
  const ICONS_PATH = filterSvgFiles(options.src);
  const data = await outputReactFile(ICONS_PATH, options);
  const outPath = path.join(options.dist, 'react', 'index.js');
  fs.outputFileSync(outPath, data.join('\n'));
  fs.outputFileSync(outPath.replace(/\.js$/, '.d.ts'), data.join('\n'));
  return outPath;
}

const capitalizeEveryWord = (str: string) => str.replace(/-(\w)/g, ($0, $1) => $1.toUpperCase()).replace(/^(\w)/g, ($0, $1) => $1.toUpperCase());

async function outputReactFile(files: string[], options: SvgToFontOptions = {}) {
  const svgoOptions = options.svgoOptions || {}
  return Promise.all(
    files.map(async filepath => {
      const name = capitalizeEveryWord(path.basename(filepath, '.svg'));
      const svg = fs.readFileSync(filepath, 'utf-8');
      const pathData = optimize(svg, {
        path: filepath,
        ...svgoOptions,
        plugins: [
          'removeXMLNS',
          'removeEmptyAttrs',
          'convertTransform',
          // 'convertShapeToPath',
          // 'removeViewBox'
          ...(svgoOptions.plugins || [])
        ]
      }) as OptimizedSvg;
      const str: string[] = (pathData.data.match(/ d="[^"]+"/g) || []).map(s => s.slice(3));
      const outDistPath = path.join(options.dist, 'react', `${name}.js`);
      const pathStrings = str.map((d, i) => `<path d=${d} fillRule="evenodd" />`);
      fs.outputFileSync(outDistPath, reactSource(name, pathStrings.join(',\n')));
      fs.outputFileSync(outDistPath.replace(/\.js$/, '.d.ts'), reactTypeSource(name));
      return `export * from './${name}';`;
    }),
  );
}
