import fs from 'fs-extra';
import path from 'path';
import { optimize, OptimizedSvg } from 'svgo';
import { filterSvgFiles, toPascalCase } from './utils';
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

const reactSource = (name: string, size: string, fontName: string, source: string) => `import React from 'react';
export const ${name} = props => (
  <svg viewBox="0 0 20 20" width="${size}" height="${size}" {...props} className={\`${fontName} \${props.className ? props.className : ''}\`}>${source}</svg>
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

async function outputReactFile(files: string[], options: SvgToFontOptions = {}) {
  const svgoOptions = options.svgoOptions || {}
  const fontSize = options.css && typeof options.css !== 'boolean' && options.css.fontSize ? options.css.fontSize : '16px';
  const fontName = options.classNamePrefix || options.fontName
  return Promise.all(
    files.map(async filepath => {
      let name = toPascalCase(path.basename(filepath, '.svg'));
      if (/^[rR]eact$/.test(name)) {
        name = name + toPascalCase(fontName);
      }
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
      const comName = isNaN(Number(name.charAt(0))) ? name : toPascalCase(fontName) + name;
      fs.outputFileSync(outDistPath, reactSource(comName, fontSize, fontName, pathStrings.join(',\n')));
      fs.outputFileSync(outDistPath.replace(/\.js$/, '.d.ts'), reactTypeSource(comName));
      return `export * from './${name}';`;
    }),
  );
}
