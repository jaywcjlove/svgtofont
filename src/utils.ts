import { SVGIcons2SVGFontStream } from 'svgicons2svgfont';
import fs, { ReadStream } from 'fs-extra';
import path from 'path';
import color from 'colors-cli';
import { load } from 'cheerio';
import svg2ttf from 'svg2ttf';
import ttf2eot from 'ttf2eot';
import ttf2woff from 'ttf2woff';
import ttf2woff2 from 'ttf2woff2';
import nunjucks from 'nunjucks';
import { merge } from 'auto-config-loader';
import { type SvgToFontOptions } from './';
import { log } from './log.js';
import { analyzeSvgColors, generateLayerSvgs, type MulticolorMap, type CreateSVGResult } from './multicolor.js';

let UnicodeObj: Record<string, string> = {};
/**
 * Unicode Private Use Area start.
 * https://en.wikipedia.org/wiki/Private_Use_Areas
 */
let startUnicode = 0xea01;

/**
 * SVG to SVG font
 */
export function createSVG(options: SvgToFontOptions = {}): Promise<CreateSVGResult> {
  const icons = listIconFiles(options.src);
  startUnicode = options.startUnicode
  UnicodeObj = {}
  const multicolorMap: MulticolorMap = {};

  // Temp directory for multicolor layer SVGs
  const tempDir = options.multicolor ? path.join(options.dist, '.multicolor-tmp') : null;
  if (tempDir) fs.ensureDirSync(tempDir);

  return new Promise(async (resolve, reject) => {
    const fontStream = new SVGIcons2SVGFontStream({
      ...options.svgicons2svgfont
    });

    function writeFontStream(svgPath: string, originalName: string, name: string) {
      const glyph = fs.createReadStream(svgPath) as ReadStream & { metadata: { unicode: string[], name: string } };

      const curUnicode = String.fromCodePoint(startUnicode);
      // Callbacks keep matching on the SVG file name. Classes use `name`.
      const [_curUnicode, _startUnicode] = options.getIconUnicode
        ? (options.getIconUnicode(originalName, curUnicode, startUnicode) || [curUnicode]) : [curUnicode];

      if (_startUnicode) startUnicode = _startUnicode;

      const unicode: string[] = [_curUnicode];
      if (curUnicode === _curUnicode && (!_startUnicode || startUnicode === _startUnicode)) startUnicode++;

      UnicodeObj[name] = unicode[0];
      if (!!options.useNameAsUnicode) {
        unicode[0] = originalName;
        UnicodeObj[name] = originalName;
      }
      // Ligatures stay the original file name. That string is font text, not a class.
      if (!!options.addLigatures) {
        unicode.push(originalName)
      }
      glyph.metadata = { unicode, name };
      fontStream.write(glyph);
    }

    function writeGlyphFromFile(filePath: string, glyphName: string): { unicode: string; codepoint: number } {
      const glyph = fs.createReadStream(filePath) as ReadStream & { metadata: { unicode: string[], name: string } };
      const curUnicode = String.fromCodePoint(startUnicode);
      const unicode: string[] = [curUnicode];
      UnicodeObj[glyphName] = unicode[0];
      startUnicode++;
      glyph.metadata = { unicode, name: glyphName };
      fontStream.write(glyph);
      return { unicode: curUnicode, codepoint: curUnicode.codePointAt(0)! };
    }

    const DIST_PATH = path.join(options.dist, options.fontName + ".svg");
    // Setting the font destination
    fontStream.pipe(fs.createWriteStream(DIST_PATH))
      .on("finish", () => {
        // Clean up temp directory
        if (tempDir) fs.removeSync(tempDir);
        log.log(`${color.green('SUCCESS')} ${color.blue_bt('SVG')} font successfully created!\n  ╰┈▶ ${DIST_PATH}`);
        resolve({ unicodeObject: UnicodeObj, multicolorMap });
      })
      .on("error", (err) => {
        if (err) {
          reject(err);
        }
      });
    icons.forEach(({ filePath, originalName, name }) => {
      if (options.multicolor) {
        const svgContent = fs.readFileSync(filePath, 'utf-8');
        const analysis = analyzeSvgColors(svgContent);

        if (analysis.isMulticolor) {
          const layerSvgs = generateLayerSvgs(analysis);
          const layers: import('./multicolor.js').MulticolorLayerInfo[] = [];

          layerSvgs.forEach((layer, idx) => {
            const glyphName = `${name}-path${idx + 1}`;
            const tmpPath = path.join(tempDir!, glyphName + '.svg');
            fs.writeFileSync(tmpPath, layer.svgContent);
            const result = writeGlyphFromFile(tmpPath, glyphName);

            layers.push({
              layerIndex: idx,
              glyphName,
              unicode: result.unicode,
              color: layer.color,
              encodedCode: result.codepoint,
            });
          });

          multicolorMap[name] = {
            originalName,
            layerCount: layers.length,
            layers,
          };

          return; // Skip normal processing for this multicolor icon
        }
      }

      writeFontStream(filePath, originalName, name);
    });

    // Do not forget to end the stream
    fontStream.end();
  });
}

/**
 * Converts a string to pascal case.
 * 
 * @example
 * 
 * ```js
 * toPascalCase('some_database_field_name'); // 'SomeDatabaseFieldName'
 * toPascalCase('Some label that needs to be pascalized');
 * // 'SomeLabelThatNeedsToBePascalized'
 * toPascalCase('some-javascript-property'); // 'SomeJavascriptProperty'
 * toPascalCase('some-mixed_string with spaces_underscores-and-hyphens');
 * // 'SomeMixedStringWithSpacesUnderscoresAndHyphens'
 * ```
 */
export const toPascalCase = (str: string) =>
  str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map(x => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase())
    .join('');

/*
 * Filter svg files
 * @return {Array} svg files
 */
export function filterSvgFiles(svgFolderPath: string): string[] {
  let files = fs.readdirSync(svgFolderPath, 'utf-8');
  let svgArr = [];
  if (!files) {
    throw new Error(`Error! Svg folder is empty.${svgFolderPath}`);
  }

  for (let i in files) {
    if (typeof files[i] !== 'string' || path.extname(files[i]) !== '.svg') continue;
    if (!~svgArr.indexOf(files[i])) {
      svgArr.push(path.join(svgFolderPath, files[i]));
    }
  }
  return svgArr;
}

export function snakeToUppercase(str: string) {
  return str.split(/[-_]/)
    .map(partial => partial.charAt(0).toUpperCase() + partial.slice(1))
    .join('')
}

/** Enum member for a normalized icon name. Leading digits are not valid identifiers. */
export function toEnumMember(name: string): string {
  const member = snakeToUppercase(name);
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(member)) return member;
  return `_${member}`;
}

/**
 * CSS-ident-safe icon name. Characters outside [A-Za-z0-9_-] become "-".
 * Leading and trailing hyphens are removed. A leading digit is prefixed
 * with "_" so the result can be a class, a SCSS variable, and an SVG id.
 * Names that are already valid are left unchanged. Ligatures keep using
 * the original file name.
 */
export function normalizeIconName(fileName: string): string {
  const name = fileName
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (/^[0-9]/.test(name)) return `_${name}`;
  return name;
}

export type IconFile = {
  filePath: string;
  /** SVG file name without the extension. */
  originalName: string;
  /** Normalized name used for classes, variables, and ids. */
  name: string;
};

/**
 * SVG icons in a folder, with file names normalized to one shared identifier.
 * Throws when a file name cannot be normalized, or when two files normalize
 * to the same name.
 */
export function listIconFiles(svgFolderPath: string): IconFile[] {
  const icons = filterSvgFiles(svgFolderPath).map((filePath) => {
    const originalName = path.basename(filePath, path.extname(filePath));
    const name = normalizeIconName(originalName);
    if (!name) {
      throw new Error(
        `Cannot derive a valid icon name from "${originalName}". ` +
        `Use a file name that contains a letter, digit, "_" or "-".`
      );
    }
    return { filePath, originalName, name };
  });

  const groups = new Map<string, string[]>();
  for (const icon of icons) {
    const originals = groups.get(icon.name);
    if (originals) originals.push(icon.originalName);
    else groups.set(icon.name, [icon.originalName]);
  }
  const collisions = [...groups.entries()].filter(([, originals]) => originals.length > 1);
  if (collisions.length > 0) {
    const details = collisions
      .map(([name, originals]) => `${originals.map((original) => `"${original}"`).join(', ')} → "${name}"`)
      .join('; ');
    throw new Error(
      `Icon names collide after normalization: ${details}. Rename the SVG files so each icon name is unique.`
    );
  }
  return icons;
}

export type TypescriptOptions = {
  extension?: 'd.ts' | 'ts' | 'tsx',
  enumName?: string
}

/**
 * Create typescript declarations for icon classnames
 */
export async function createTypescript(options: Omit<SvgToFontOptions, 'typescript'> & { typescript: TypescriptOptions | true }) {
  const tsOptions = options.typescript === true ? {} : options.typescript;
  const uppercaseFontName = snakeToUppercase(options.fontName);
  const { extension = 'd.ts', enumName = uppercaseFontName } = tsOptions;
  const DIST_PATH = path.join(options.dist, `${options.fontName}.${extension}`);
  const fileNames = listIconFiles(options.src).map(icon => icon.name);
  await fs.writeFile(
    DIST_PATH,
    [
      `export enum ${enumName} {`,
      ...fileNames.map(name => `  ${toEnumMember(name)} = "${options.classNamePrefix}-${name}",`),
      '}',
      `export type ${enumName}Classname = ${fileNames.map(name => `"${options.classNamePrefix}-${name}"`).join(' | ')}`,
      `export type ${enumName}Icon = ${fileNames.map(name => `"${name}"`).join(' | ')}`,
      `export const ${enumName}Prefix = "${options.classNamePrefix}-"`,
    ].join('\n'),
  );
  log.log(`${color.green('SUCCESS')} Created ${DIST_PATH}`);
}

/**
 * SVG font to TTF
 */
export function createTTF(options: SvgToFontOptions = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    options.svg2ttf = options.svg2ttf || {};
    const DIST_PATH = path.join(options.dist, options.fontName + ".ttf");
    let ttf = svg2ttf(fs.readFileSync(path.join(options.dist, options.fontName + ".svg"), "utf8"), options.svg2ttf);
    const ttfBuf = Buffer.from(ttf.buffer);
    fs.writeFile(DIST_PATH, ttfBuf, (err: NodeJS.ErrnoException) => {
      if (err) {
        return reject(err);
      }
      log.log(`${color.green('SUCCESS')} ${color.blue_bt('TTF')} font successfully created!\n  ╰┈▶ ${DIST_PATH}`);
      resolve(ttfBuf);
    });
  });
};

/**
 * TTF font to EOT
 */
export function createEOT(options: SvgToFontOptions = {}, ttf: Buffer) {
  return new Promise((resolve, reject) => {
    const DIST_PATH = path.join(options.dist, options.fontName + '.eot');
    const ttf2eotResult = ttf2eot(ttf);
    const eot = Buffer.from(ttf2eotResult.buffer, ttf2eotResult.byteOffset, ttf2eotResult.byteLength);

    fs.writeFile(DIST_PATH, eot, (err: NodeJS.ErrnoException) => {
      if (err) {
        return reject(err);
      }
      log.log(`${color.green('SUCCESS')} ${color.blue_bt('EOT')} font successfully created!\n  ╰┈▶ ${DIST_PATH}`);
      resolve(eot);
    });
  });
};

/**
 * TTF font to WOFF
 */
export function createWOFF(options: SvgToFontOptions = {}, ttf: Buffer) {
  return new Promise((resolve, reject) => {
    const DIST_PATH = path.join(options.dist, options.fontName + ".woff");
    const woff = Buffer.from(ttf2woff(ttf).buffer);
    fs.writeFile(DIST_PATH, woff, (err) => {
      if (err) {
        return reject(err);
      }
      log.log(`${color.green('SUCCESS')} ${color.blue_bt('WOFF')} font successfully created!\n  ╰┈▶ ${DIST_PATH}`);
      resolve(woff);
    });
  });
};

/**
 * TTF font to WOFF2
 */
export function createWOFF2(options: SvgToFontOptions = {}, ttf: Buffer) {
  return new Promise((resolve, reject) => {
    const DIST_PATH = path.join(options.dist, options.fontName + ".woff2");
    const woff2 = Buffer.from(ttf2woff2(ttf).buffer);
    fs.writeFile(DIST_PATH, woff2, (err) => {
      if (err) {
        return reject(err);
      }
      log.log(`${color.green('SUCCESS')} ${color.blue_bt('WOFF2')} font successfully created!\n  ╰┈▶ ${DIST_PATH}`);
      resolve({
        path: DIST_PATH
      });
    });
  });
};

/**
 * Create SVG Symbol
 */
export function createSvgSymbol(options: SvgToFontOptions = {}) {
  const DIST_PATH = path.join(options.dist, `${options.fontName}.symbol.svg`);
  const $ = load('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="0" height="0" style="display:none;"></svg>');
  const icons = listIconFiles(options.src);
  return new Promise((resolve, reject) => {
    icons.forEach(({ filePath, name }) => {
      let file = fs.readFileSync(filePath, "utf8");

      // trim xml declaration
      file = file.replace(/<\?xml.*?\?>\s*/g, '').trim();

      const svgNode = $(file);
      const symbolNode = $("<symbol></symbol>");
      symbolNode.attr("viewBox", svgNode.attr("viewBox"));
      symbolNode.attr("id", `${options.classNamePrefix}-${name}`);
      symbolNode.append(svgNode.html());
      $('svg').append(symbolNode);
    });

    fs.writeFile(DIST_PATH, $.html("svg"), (err) => {
      if (err) {
        return reject(err);
      }
      log.log(`${color.green('SUCCESS')} ${color.blue_bt('Svg Symbol')} font successfully created!\n  ╰┈▶ ${DIST_PATH}`);
      resolve({
        path: DIST_PATH,
        svg: $.html("svg")
      });
    });
  });
};

export type CSSOptions = {
  /**
   * Output the css file to the specified directory
   */
  output?: string;
  /**
   * Which files are exported.
   */
  include?: RegExp;
  /**
   * Setting font size.
   */
  fontSize?: string | boolean;
  /**
   * Set the path in the css file
   * https://github.com/jaywcjlove/svgtofont/issues/48#issuecomment-739547189
   */
  cssPath?: string;
  /**
   * Set file name
   * https://github.com/jaywcjlove/svgtofont/issues/48#issuecomment-739547189
   */
  fileName?: string;
  /**
   * Ad hoc template variables.
   */
  templateVars?: Record<string, any>;
  /**
   * When including CSS files in a CSS file,
   * you can add a timestamp parameter or custom text to the file path to prevent browser caching issues and ensure style updates are applied. @default true
   * @example `path/to/iconfont.css?t=1612345678`
   */
  hasTimestamp?: boolean | string;
}

// As we are processing css files, we need to eacape HTML entities.
const safeNunjucks = nunjucks.configure({ autoescape: false });

/**
 * Copy template files
 */
export async function copyTemplate(inDir: string, outDir: string, { _opts, ...vars }: Record<string, any> & { _opts: CSSOptions }) {
  const files = await fs.readdir(inDir, { withFileTypes: true });
  const context = {
    ...(_opts.templateVars || {}),
    ...vars,
    cssPath: _opts.cssPath || '',
    filename: _opts.fileName || vars.fontname,
  }
  await fs.ensureDir(outDir);
  for (const file of files) {
    if (!file.isFile()) continue;
    if (_opts.include && !(new RegExp(_opts.include)).test(file.name)) continue;
    let newFileName = file.name.replace(/\.template$/, '').replace(/^_/, '');
    for (const key in context) newFileName = newFileName.replace(`{{${key}}}`, `${context[key]}`);
    const template = await fs.readFile(path.join(inDir, file.name), 'utf8');
    const content = safeNunjucks.renderString(template, context);
    const filePath = path.join(outDir, newFileName)
    await fs.writeFile(filePath, content);
    log.log(`${color.green('SUCCESS')} Created ${filePath} `);
  }
};

/**
 * Create HTML
 */
export function createHTML(templatePath: string, data: Record<string, any>): string {
  return nunjucks.renderString(fs.readFileSync(templatePath, 'utf8'), {
    ...data,
    Date: Date,
    JSON: JSON,
    Math: Math,
    Number: Number,
    Object: Object,
    RegExp: RegExp,
    String: String,
    typeof: (v: any) => typeof v,
  });
};

export function generateFontFaceCSS(fontName: string, cssPath: string, timestamp: number, excludeFormat: string[], hasTimestamp: boolean | string = true): string {
  const timestamString = hasTimestamp === true ? `?t=${timestamp}` : (typeof hasTimestamp == 'string' ? `?t=${hasTimestamp}` : undefined);
  const formats = [
    { ext: 'eot', format: 'embedded-opentype', ieFix: true },
    { ext: 'woff2', format: 'woff2' },
    { ext: 'woff', format: 'woff' },
    { ext: 'ttf', format: 'truetype' },
    { ext: 'svg', format: 'svg' }
  ];
  let cssString = `  font-family: "${fontName}";\n`;
  if (!excludeFormat.includes('eot')) {
    cssString += `  src: url('${cssPath}${fontName}.eot${timestamString || ''}'); /* IE9*/\n`;
  }
  cssString += '  src: ';
  const srcParts = formats
    .filter(format => !excludeFormat.includes(format.ext))
    .map(format => {
      if (format.ext === 'eot') {
        return `url('${cssPath}${fontName}.eot${timestamString || '?'}#iefix') format('${format.format}') /* IE6-IE8 */`;
      }
      return `url('${cssPath}${fontName}.${format.ext}${timestamString || ''}') format('${format.format}')`;
    });
  cssString += srcParts.join(',\n  ') + ';';
  return cssString;
}

export const getDefaultOptions = (options: SvgToFontOptions): SvgToFontOptions => {
  return merge({
    dist: path.resolve(process.cwd(), 'fonts'),
    src: path.resolve(process.cwd(), 'svg'),
    startUnicode: 0xea01,
    svg2ttf: {},
    svgicons2svgfont: {
      fontName: 'iconfont',
    },
    fontName: 'iconfont',
    symbolNameDelimiter: '-',
    multicolor: false,
  }, options);
};
