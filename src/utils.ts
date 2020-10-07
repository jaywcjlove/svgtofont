import SVGIcons2SVGFont, { Glyphs } from 'svgicons2svgfont';
import fs from 'fs-extra';
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
  return new Promise((resolve, reject) => {
    // init
    const fontStream = new SVGIcons2SVGFont({
      ...options.svgicons2svgfont
    });

    function writeFontStream(svgPath: string) {
      // file name
      let _name = path.basename(svgPath, ".svg");
      const glyph = fs.createReadStream(svgPath) as Glyphs;
      glyph.metadata = { unicode: getIconUnicode(_name), name: _name };
      fontStream.write(glyph);
    }

    const DIST_PATH = path.join(options.dist, options.fontName + ".svg");
    // Setting the font destination
    fontStream.pipe(fs.createWriteStream(DIST_PATH))
      .on("finish", () => {
        console.log(`${color.green('SUCCESS')} ${color.blue('SVG')} font successfully created!\n  ╰┈▶ ${DIST_PATH}`);
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

/*
 * Get icon unicode
 * @return {Array} unicode array
 */
function getIconUnicode(name: string) {
  let unicode = String.fromCharCode(startUnicode++);
  UnicodeObj[name] = unicode;
  return [unicode];
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
      console.log(`${color.green('SUCCESS')} ${color.blue('TTF')} font successfully created!\n  ╰┈▶ ${DIST_PATH}`);
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
      console.log(`${color.green('SUCCESS')} ${color.blue('EOT')} font successfully created!\n  ╰┈▶ ${DIST_PATH}`);
      resolve();
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
      console.log(`${color.green('SUCCESS')} ${color.blue('WOFF')} font successfully created!\n  ╰┈▶ ${DIST_PATH}`);
      resolve();
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
      console.log(`${color.green('SUCCESS')} ${color.blue('WOFF2')} font successfully created!\n  ╰┈▶ ${DIST_PATH}`);
      resolve();
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
      symbolNode.append(svgNode.contents());
      $('svg').append(symbolNode);
    });

    fs.writeFile(DIST_PATH, $.html("svg"), (err) => {
      if (err) {
        return reject(err);
      }
      console.log(`${color.green('SUCCESS')} ${color.blue('Svg Symbol')} font successfully created!\n  ╰┈▶ ${DIST_PATH}`);
      resolve();
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
}

/**
 * Copy template files
 */
export function copyTemplate(inDir: string, outDir: string, { _opts, ...vars }: Record<string, any> & { _opts: CSSOptions}) {
  const removeFiles: Array<string> = [];
  return new Promise((resolve, reject) => {
    copy(inDir, outDir, vars, async (err, createdFiles) => {
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
      if (_opts.output) {
        const output = path.join(process.cwd(), _opts.output);
        await Promise.all(createdFiles.map(async (file) => {
          await moveFile(file, path.join(output, path.basename(file)));
          return null;
        }));
      }
      createdFiles.forEach(filePath => console.log(`${color.green('SUCCESS')} Created ${filePath} `));
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

