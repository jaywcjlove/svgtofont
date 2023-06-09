import SVGIcons2SVGFont from 'svgicons2svgfont';
import fs, { ReadStream } from 'fs-extra';
import path from 'path';
import ejs from 'ejs';
import color from 'colors-cli';
import cheerio from 'cheerio';
import svg2ttf from 'svg2ttf';
import ttf2eot from 'ttf2eot';
import ttf2woff from 'ttf2woff';
import ttf2woff2 from 'ttf2woff2';
import copy from 'copy-template-dir';
import del from 'del';
import moveFile from 'move-file';
import { SvgToFontOptions } from './';
import { log } from './log';

let UnicodeObj: Record<string, string> = {};
/**
 * Unicode Private Use Area start.
 * https://en.wikipedia.org/wiki/Private_Use_Areas
 */
let startUnicode = 0xea01;

/**
 * SVG to SVG font
 */
export function createSVG(options: SvgToFontOptions = {}): Promise<Record<string, string>> {
  startUnicode = options.startUnicode
  UnicodeObj = {}
  return new Promise((resolve, reject) => {
    // init
    const fontStream = new SVGIcons2SVGFont({
      log: (message) => log.log(message),
      ...options.svgicons2svgfont
    });

    function writeFontStream(svgPath: string) {
      // file name
      let _name = path.basename(svgPath, ".svg");
      const glyph = fs.createReadStream(svgPath) as ReadStream & { metadata: { unicode: string[], name: string } };

      const curUnicode = String.fromCharCode(startUnicode);
      const [_curUnicode, _startUnicode] = options.getIconUnicode 
              ? (options.getIconUnicode(_name, curUnicode, startUnicode) || [curUnicode]) : [curUnicode];

      if (_startUnicode) startUnicode = _startUnicode;

      const unicode: string[] = [_curUnicode];
      if(curUnicode === _curUnicode && (!_startUnicode || startUnicode === _startUnicode)) startUnicode++;

      UnicodeObj[_name] = unicode[0];
      if (!!options.useNameAsUnicode)  {
        unicode[0] = _name;
        UnicodeObj[_name] = _name;
      }
      glyph.metadata = { unicode , name: _name };
      fontStream.write(glyph);
    }

    const DIST_PATH = path.join(options.dist, options.fontName + ".svg");
    // Setting the font destination
    fontStream.pipe(fs.createWriteStream(DIST_PATH))
      .on("finish", () => {
        log.log(`${color.green('SUCCESS')} ${color.blue_bt('SVG')} font successfully created!\n  ╰┈▶ ${DIST_PATH}`);
        resolve(UnicodeObj);
      })
      .on("error", (err) => {
        if (err) {
          reject(err);
        }
      });
    filterSvgFiles(options.src).forEach((svg: string) => {
      if (typeof svg !== 'string') return false;
      writeFontStream(svg);
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
  const fileNames = filterSvgFiles(options.src).map(svgPath => path.basename(svgPath, path.extname(svgPath)));
  await fs.writeFile(
    DIST_PATH,
    `export enum ${enumName} {\n` +
      fileNames.map(name => `  ${snakeToUppercase(name)} = "${options.classNamePrefix}-${name}"`).join(',\n') +
    '\n}\n\n' +
    `export type ${enumName}Classname = ${fileNames.map(name => `"${options.classNamePrefix}-${name}"`).join(' | ')}\n` +
    `export type ${enumName}Icon = ${fileNames.map(name => `"${name}"`).join(' | ')}\n` +
    `export const ${enumName}Prefix = "${options.classNamePrefix}-"`
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
    const eot = Buffer.from(ttf2eot(ttf).buffer);

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
  const $ = cheerio.load('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="0" height="0" style="display:none;"></svg>');
  return new Promise((resolve, reject) => {
    filterSvgFiles(options.src).forEach(svgPath => {
      const fileName = path.basename(svgPath, path.extname(svgPath));
      const file = fs.readFileSync(svgPath, "utf8");
      const svgNode = $(file);
      const symbolNode = $("<symbol></symbol>");
      symbolNode.attr("viewBox", svgNode.attr("viewBox"));
      symbolNode.attr("id", `${options.classNamePrefix}-${fileName}`);
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
  fontSize?: string;
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
}

/**
 * Copy template files
 */
export function copyTemplate(inDir: string, outDir: string, { _opts, ...vars }: Record<string, any> & { _opts: CSSOptions}) {
  const removeFiles: Array<string> = [];
  return new Promise((resolve, reject) => {
    copy(inDir, outDir, {
      ...vars,
      cssPath: _opts.cssPath || '',
      filename: _opts.fileName || vars.fontname,
    }, async (err, createdFiles) => {
      if (err) reject(err);
      createdFiles = createdFiles.map(filePath => {
        if (_opts.include && (new RegExp(_opts.include)).test(filePath) || !_opts.include) {
          return filePath;
        } else {
          removeFiles.push(filePath);
        }
      }).filter(Boolean);
      if (removeFiles.length > 0) {
        await del([...removeFiles]);
      }
      createdFiles = await Promise.all(createdFiles.map(async (file) => {
        if (!file.endsWith('.template')) {
          return file;
        }

        const changedFile = file.replace('.template', '');
        await moveFile(file, changedFile);
        return changedFile;
      }));
      if (_opts.output) {
        const output = path.join(process.cwd(), _opts.output);
        await Promise.all(createdFiles.map(async (file) => {
          await moveFile(file, path.join(output, path.basename(file)));
          return null;
        }));
      }
      createdFiles.forEach(filePath => log.log(`${color.green('SUCCESS')} Created ${filePath} `));
      resolve(createdFiles);
    })
  });
};

/**
 * Create HTML
 */
export function createHTML(outPath: string,data: ejs.Data, options?: ejs.Options): Promise<string> {
  return new Promise((resolve, reject) => {
    ejs.renderFile(outPath, data, options, (err, str) => {
      if (err) reject(err);
      resolve(str);
    });
  });
};

