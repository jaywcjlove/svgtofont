/// <reference types="./types" />

import path from 'path';
import fs from 'fs-extra';
import image2uri from 'image2uri';
import htmlMinifier from 'html-minifier';
import { SVGIcons2SVGFontOptions } from 'svgicons2svgfont';
import color from 'colors-cli';
import { generateIconsSource, generateReactIcons } from './generate';
import { createSVG, createTTF, createEOT, createWOFF, createWOFF2, createSvgSymbol, copyTemplate, CSSOptions, createHTML } from './utils';

export type SvgToFontOptions = {
  /**
   * The output directory.
   * @default fonts
   * @example
   * ```
   * path.join(process.cwd(), 'fonts')
   * ```
   */
  dist?: string;
  /**
   * svg path
   * @default svg
   * @example
   * ```
   * path.join(process.cwd(), 'svg')
   * ```
   */
  src?: string;
  /**
   * The font family name you want.
   * @default iconfont
   */
  fontName?: string;
  /**
   * Create CSS/LESS/Scss/Styl files, default `true`.
   */
  css?: boolean | CSSOptions;
  /**
   * Output `./dist/react/`, SVG generates `react` components.
   */
  outSVGReact?: boolean;
  /**
   * Output `./dist/svgtofont.json`, The content is as follows:
   * @example
   * ```js
   * {
   *   "adobe": ["M14.868 3H23v19L14.868 3zM1 3h8.8.447z...."],
   *   "git": ["M2.6 10.59L8.38 4.8l1.69 1.7c-.24c-.6.34-1 .99-1..."],
   *   "stylelint": ["M129.74 243.648c28-100.5.816c2.65..."]
   * }
   * ```
   */
  outSVGPath?: boolean;
  /**
   * This is the setting for [svgicons2svgfont](https://github.com/nfroidure/svgicons2svgfont/tree/dd713bea4f97afa59f7dba6a21ff7f22db565bcf#api)
   */
  svgicons2svgfont?: SVGIcons2SVGFontOptions;
  /**
   * Create font class name prefix, default value font name.
   * @default fontName
   */
  classNamePrefix?: SvgToFontOptions['fontName'];
  /**
   * unicode start number
   * @default 10000
   */
  startUnicode?: number;
  /**
   * Clear output directory contents
   * @default false
   */
  emptyDist?: boolean;
  /**
   * This is the setting for [svg2ttf](https://github.com/fontello/svg2ttf/tree/c33a126920f46b030e8ce960cc7a0e38a6946bbc#svg2ttfsvgfontstring-options---buf)
   */
  svg2ttf?: unknown;
  website?: {
    /**
     * Add a Github corner to your website
     * @like https://github.com/uiwjs/react-github-corners
     */
    corners?: {
      /**
       * @example `https://github.com/jaywcjlove/svgtofont`
       */
      url?: string,
      /**
       * @default 60
       */
      width?: number,
      /**
       * @default 60
       */
      height?: number,
      /**
       * @default #151513
       */
      bgColor?: '#dc3545'
    },
    /**
     * @default unicode
     */
    index?: 'font-class' | 'unicode' | 'symbol';
    /**
     * website title
     */
    title?: string;
    /**
     * @example
     * ```js
     * path.resolve(rootPath, "favicon.png")
     * ```
     */
    favicon?: string;
    /**
     * Must be a .svg format image.
     * @example
     * ```js
     * path.resolve(rootPath, "svg", "git.svg")
     * ```
     */
    logo?: string,
    version?: string,
    meta?: {
      description?: string;
      keywords?: string;
    },
    description?: string;
    template?: string;
    footerInfo?: string;
    links: Array<{
      title: string;
      url: string;
    }>;
  };
}

export default async (options: SvgToFontOptions = {}) => {
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (fs.pathExistsSync(pkgPath)) {
    const pkg = require(pkgPath);
    if (pkg.svgtofont) {
      options = { ...options, ...pkg.svgtofont }
    }
  }

  options.dist = options.dist || path.join(process.cwd(), 'fonts');
  options.src = options.src || path.join(process.cwd(), 'svg');
  options.startUnicode = options.startUnicode || 0xea01;
  options.svg2ttf = options.svg2ttf || {};
  options.emptyDist = options.emptyDist;
  options.fontName = options.fontName || 'iconfont';
  options.svgicons2svgfont = options.svgicons2svgfont || {};
  options.svgicons2svgfont.fontName = options.fontName;
  options.classNamePrefix = options.classNamePrefix || options.fontName;
  const fontSize = options.css && typeof options.css !== 'boolean' && options.css.fontSize ? options.css.fontSize : '16px';
  // If you generate a font you need to generate a style.
  if (options.website) options.css = true;

  try {
    if (options.emptyDist) {
      await fs.emptyDir(options.dist);
    }
    // Ensures that the directory exists.
    await fs.ensureDir(options.dist);
    const unicodeObject = await createSVG(options);

    let cssString: string[] = [];
    let cssToVars: string[] = [];
    let cssIconHtml: string[] = [];
    let unicodeHtml: string[] = [];
    let symbolHtml: string[] = [];
    Object.keys(unicodeObject).forEach(name => {
      let _code = unicodeObject[name];
      cssIconHtml.push(`<li class="class-icon"><i class="${options.classNamePrefix}-${name}"></i><p class="name">${name}</p></li>`);
      unicodeHtml.push(`<li class="unicode-icon"><span class="iconfont">${_code}</span><h4>${name}</h4><span class="unicode">&amp;#${_code.charCodeAt(0)};</span></li>`);
      symbolHtml.push(`
        <li class="symbol">
          <svg class="icon" aria-hidden="true">
            <use xlink:href="${options.fontName}.symbol.svg#${options.classNamePrefix}-${name}"></use>
          </svg>
          <h4>${options.classNamePrefix}-${name}</h4>
        </li>
      `);
      cssString.push(`.${options.classNamePrefix}-${name}:before { content: "\\${_code.charCodeAt(0).toString(16)}"; }\n`);
      cssToVars.push(`$${options.classNamePrefix}-${name}: "\\${_code.charCodeAt(0).toString(16)}";\n`);
    });
    const ttf = await createTTF(options);
    await createEOT(options, ttf);
    await createWOFF(options, ttf);
    await createWOFF2(options, ttf);
    await createSvgSymbol(options);

    if (options.css) {
      console.log('fontSize::', fontSize)
      await copyTemplate(path.resolve(__dirname, 'styles'), options.dist, {
        fontname: options.fontName,
        cssString: cssString.join(''),
        cssToVars: cssToVars.join(''),
        fontSize: fontSize,
        timestamp: new Date().getTime(),
        prefix: options.classNamePrefix || options.fontName,
        _opts: typeof options.css === 'boolean' ? {} : {...options.css}
      });
    }


    if (options.website) {
      const pageName = ['font-class', 'unicode', 'symbol'];
      let fontClassPath = path.join(options.dist, 'index.html');
      let unicodePath = path.join(options.dist, 'unicode.html');
      let symbolPath = path.join(options.dist, 'symbol.html');
      // setting default home page.
      const indexName = pageName.includes(options.website.index) ? pageName.indexOf(options.website.index) : 0;
      pageName.forEach((name, index) => {
        const _path = path.join(options.dist, indexName === index ? 'index.html' : `${name}.html`);
        if (name === 'font-class') fontClassPath = _path;
        if (name === 'unicode') unicodePath = _path;
        if (name === 'symbol') symbolPath = _path;
      });
      // default template
      options.website.template = options.website.template || path.join(__dirname, 'website', 'index.ejs');
      // template data
      const tempData: SvgToFontOptions['website'] & {
        fontname: string;
        classNamePrefix: string;
        _type: string;
        _link: string;
        _IconHtml: string;
        _title: string;
      } = {
        meta: null,
        links: null,
        corners: null,
        description: null,
        footerInfo: null,
        ...options.website,
        fontname: options.fontName,
        classNamePrefix: options.classNamePrefix,
        _type: 'font-class',
        _link: `${options.fontName}.css`,
        _IconHtml: cssIconHtml.join(''),
        _title: options.website.title || options.fontName
      };
      // website logo
      if (options.website.logo && fs.pathExistsSync(options.website.logo) && path.extname(options.website.logo) === '.svg') {
        tempData.logo = fs.readFileSync(options.website.logo).toString();
      }
      // website favicon
      if (options.website.favicon && fs.pathExistsSync(options.website.favicon)) {
        tempData.favicon = image2uri(options.website.favicon);
      } else {
        tempData.favicon = '';
      }
      const classHtmlStr = await createHTML(options.website.template, tempData);
      fs.outputFileSync(
        fontClassPath,
        htmlMinifier.minify(classHtmlStr as string, { collapseWhitespace: true, minifyCSS: true })
      );
      console.log(`${color.green('SUCCESS')} Created ${fontClassPath} `);

      tempData._IconHtml = unicodeHtml.join('');
      tempData._type = 'unicode';
      const unicodeHtmlStr = await createHTML(options.website.template, tempData);
      fs.outputFileSync(
        unicodePath,
        htmlMinifier.minify(unicodeHtmlStr, { collapseWhitespace: true, minifyCSS: true })
      );
      console.log(`${color.green('SUCCESS')} Created ${unicodePath} `);

      tempData._IconHtml = symbolHtml.join('');
      tempData._type = 'symbol';
      const symbolHtmlStr = await createHTML(options.website.template, tempData);
      fs.outputFileSync(
        symbolPath,
        htmlMinifier.minify(symbolHtmlStr, { collapseWhitespace: true, minifyCSS: true })
      );
      console.log(`${color.green('SUCCESS')} Created ${unicodePath} `);
    }


    if (options.outSVGPath) {
      const outPath = await generateIconsSource(options);
      console.log(`${color.green('SUCCESS')} Created ${outPath} `);
    }
    if (options.outSVGReact) {
      const outPath = await generateReactIcons(options);
      console.log(`${color.green('SUCCESS')} Created React Components. `);
    }

  } catch (error) {
    console.log('SvgToFont:ERR:', error);
  }
}
