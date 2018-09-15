

const fs = require("fs-extra");
const path = require("path");
const minify = require("html-minifier").minify;
require("colors-cli/toxic");
const {
  createSVG,
  createTTF,
  createEOT,
  createWOFF,
  createWOFF2,
  createHTML,
  copyTemplate
} = require("./utils");

module.exports = function create(options) {
  if (!options) options = {}; 
  options.dist = options.dist || "dist";
  options.src = options.src || "svg";
  options.unicodeStart = options.unicodeStart || 10000;
  options.svg2ttf = options.svg2ttf || {};
  options.svgicons2svgfont = options.svgicons2svgfont || {};
  options.svgicons2svgfont.fontName = options.fontName || "iconfont";
  options.clssaNamePrefix = options.clssaNamePrefix || options.svgicons2svgfont.fontName;
  let dist = options.dist;

  fs.emptyDirSync(dist);
  let cssString = [];
  let cssIconHtml = [];
  let unicodeHtml = [];
  const htmlPath = path.join(options.dist, "index.html");
  const unicodeHtmlPath = path.join(options.dist, "unicode.html");

  return createSVG(options)
    .then(UnicodeObject => {
      Object.keys(UnicodeObject).forEach(name => {
        let _code = UnicodeObject[name];
        let _num = _code.charCodeAt(0).toString(16);
        cssIconHtml.push(`<li class="class-icon"><i class="${options.clssaNamePrefix}-${name}"></i><p class="name">${name}</p></li>`);
        unicodeHtml.push(`<li class="unicode-icon"><span class="iconfont">${_code}</span><h4>${name}</h4><span class="unicode">&amp;#${_code.charCodeAt(0)};</span></li>`);
        cssString.push(`.${options.clssaNamePrefix}-${name}:before { content: "\\${_num}"; }\n`);
      });
      return createTTF(options);
    })
    .then(() => {
      return createEOT(options);
    })
    .then(() => {
      return createWOFF(options);
    })
    .then(() => {
      return createWOFF2(options);
    })
    .then(() => {
      // If you generate a font you need to generate a style.
      if (options.website) options.css = true;
      if (options.css) {
        const font_temp = path.resolve(__dirname, "styles");
        return copyTemplate(font_temp, options.dist, {
          fontname: options.fontName,
          cssString: cssString.join(''),
          timestamp: new Date().getTime(),
          prefix: options.clssaNamePrefix || options.fontName
        });
      }
    })
    .then(filePaths => {
      // output log
      filePaths && filePaths.length > 0 && filePaths.forEach(filePath =>
          console.log(`${'SUCCESS'.green} Created ${filePath} `)
        );
    })
    .then(() => {
      if (options.website) {
        options.website.template = options.website.template || path.join(__dirname, "website", "index.ejs");
        this.tempData = { ...options.website, _fontname: options.fontName, _unicode: false, _logo: options.website.logo, _link: `${options.fontName}.css`, _IconHtml: cssIconHtml.join(''), _title: options.website.title || options.fontName };
        // website logo
        if (options.website.logo && fs.pathExistsSync(options.website.logo) && path.extname(options.website.logo) === ".svg") {
          this.tempData._logo = fs.readFileSync(options.website.logo);
        }
        return createHTML({
          outPath: options.website.template,
          data: this.tempData
        });
      }
    })
    .then(str => fs.outputFileSync(htmlPath, minify(str, { collapseWhitespace: true, minifyCSS: true })))
    .then(str => console.log(`${'SUCCESS'.green} Created ${htmlPath} `))
    .then(str => {
      if (options.website) {
        this.tempData._IconHtml = unicodeHtml.join('');
        this.tempData._unicode = true;
        return createHTML({
          outPath: options.website.template,
          data: this.tempData
        });
      }
    })
    .then(str => fs.outputFileSync(unicodeHtmlPath, minify(str, { collapseWhitespace: true, minifyCSS: true })))
    .then(str => console.log(`${'SUCCESS'.green} Created ${unicodeHtmlPath} `));
}