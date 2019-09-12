const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const cheerio = require("cheerio");
const SVGIcons2SVGFont = require("svgicons2svgfont");
const copy = require("copy-template-dir");
const ttf2eot = require('ttf2eot');
const svg2ttf = require("svg2ttf");
const ttf2woff = require("ttf2woff");
const ttf2woff2 = require("ttf2woff2");
require("colors-cli/toxic");

let UnicodeObj = {};
// Unicode Private Use Area start.
// https://en.wikipedia.org/wiki/Private_Use_Areas
let startUnicode = 0xea01;

/*
 * Get icon unicode
 * @return {Array} unicode array
 */
function getIconUnicode(name) {
  let unicode = String.fromCharCode(startUnicode++);
  UnicodeObj[name] = unicode;
  return [unicode];
}
/*
 * Filter svg files
 * @return {Array} svg files
 */
exports.filterSvgFiles = (svgFolderPath) => {
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
/**
 * SVG to SVG font
 */
exports.createSVG = OPTIONS => {
  UnicodeObj = {};
  number = OPTIONS.unicodeStart;
  return new Promise((resolve, reject) => {
    // init
    const fontStream = new SVGIcons2SVGFont({
      ...OPTIONS.svgicons2svgfont
    });
    function writeFontStream(svgPath) {
      // file name
      let _name = path.basename(svgPath, ".svg");
      const glyph = fs.createReadStream(svgPath);
      glyph.metadata = { unicode: getIconUnicode(_name), name: _name };
      fontStream.write(glyph);
    }

    const DIST_PATH = path.join(OPTIONS.dist, OPTIONS.fontName + ".svg");
    // Setting the font destination
    fontStream.pipe(fs.createWriteStream(DIST_PATH)).on("finish", () => {
      console.log(`${"SUCCESS".green} ${'SVG'.blue_bt} font successfully created! ${DIST_PATH}`);
      resolve(UnicodeObj);
    }).on("error", (err) => {
      if (err) {
        console.log(err);
        reject(err);
      }
    });
    this.filterSvgFiles(OPTIONS.src).forEach(svg => {
      if (typeof svg !== "string") return false;
      writeFontStream(svg);
    });

    // Do not forget to end the stream
    fontStream.end();
  });
};

/**
 * SVG font to TTF
 */
exports.createTTF = OPTIONS => {
  return new Promise((resolve, reject) => {
    OPTIONS.svg2ttf = OPTIONS.svg2ttf || {};
    const DIST_PATH = path.join(OPTIONS.dist, OPTIONS.fontName + ".ttf");
    let ttf = svg2ttf(fs.readFileSync(path.join(OPTIONS.dist, OPTIONS.fontName + ".svg"), "utf8"), OPTIONS.svg2ttf);
    ttf = this.ttf = Buffer.from(ttf.buffer);
    fs.writeFile(DIST_PATH, ttf, (err, data) => {
      if (err) {
        return reject(err);
      }
      console.log(`${"SUCCESS".green} ${"TTF".blue_bt} font successfully created! ${DIST_PATH}`);
      resolve(data);
    });
  });
};

/**
 * TTF font to EOT
 */
exports.createEOT = OPTIONS => {
  return new Promise((resolve, reject) => {
    const DIST_PATH = path.join(OPTIONS.dist, OPTIONS.fontName + '.eot');
    const eot = Buffer.from(ttf2eot(this.ttf).buffer);

    fs.writeFile(DIST_PATH, eot, (err, data) => {
      if (err) {
        return reject(err);
      }
      console.log(`${"SUCCESS".green} ${"EOT".blue_bt} font successfully created! ${DIST_PATH}`);
      resolve(data);
    });
  });
};

/**
 * TTF font to WOFF
 */
exports.createWOFF = OPTIONS => {
  return new Promise((resolve, reject) => {
    const DIST_PATH = path.join(OPTIONS.dist, OPTIONS.fontName + ".woff");
    const woff = Buffer.from(ttf2woff(this.ttf).buffer);
    fs.writeFile(DIST_PATH, woff, (err, data) => {
      if (err) {
        return reject(err);
      }
      console.log(`${"SUCCESS".green} ${"WOFF".blue_bt} font successfully created! ${DIST_PATH}`);
      resolve(data);
    });
  });
};

/**
 * TTF font to WOFF2
 */
exports.createWOFF2 = OPTIONS => {
  return new Promise((resolve, reject) => {
    const DIST_PATH = path.join(OPTIONS.dist, OPTIONS.fontName + ".woff2");
    const woff2 = Buffer.from(ttf2woff2(this.ttf).buffer);
    fs.writeFile(DIST_PATH, woff2, (err, data) => {
      if (err) {
        return reject(err);
      }
      console.log(`${"SUCCESS".green} ${"WOFF2".blue_bt} font successfully created! ${DIST_PATH}`);
      resolve(data);
    });
  });
};

/**
 * Copy template files
 */
exports.copyTemplate = (inDir, outDir, vars) => {
  return new Promise((resolve, reject) => {
    copy(inDir, outDir, vars, (err, createdFiles) => {
      if (err) reject(err);
      resolve(createdFiles);
    })
  });
};

/**
 * Create HTML
 */
exports.createHTML = ({ outPath, data = {}, options = {} }) => {
  return new Promise((resolve, reject) => {
    ejs.renderFile(outPath, data, options, (err, str) => {
      if (err) reject(err);
      resolve(str);
    });
  });
};

/**
 * Create SVG Symbol
 */
exports.createSvgSymbol = OPTIONS => {
  const DIST_PATH = path.join(OPTIONS.dist, `${OPTIONS.fontName}.symbol.svg`);
  const $ = cheerio.load('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="0" height="0" style="display:none;"></svg>');
  return new Promise((resolve, reject) => {
    this.filterSvgFiles(OPTIONS.src).forEach(svgPath => {
      const fileName = path.basename(svgPath, path.extname(svgPath));
      const file = fs.readFileSync(svgPath, "utf8");
      const svgNode = $(file);
      symbolNode = $("<symbol></symbol>");
      symbolNode.attr("viewBox", svgNode.attr("viewBox"));
      symbolNode.attr("id", `${OPTIONS.clssaNamePrefix}-${fileName}`);
      symbolNode.append(svgNode.contents());
      $('svg').append(symbolNode);
    });

    fs.writeFile(DIST_PATH, $.html("svg"), (err, data) => {
      if (err) {
        return reject(err);
      }
      console.log(`${"SUCCESS".green} ${"Svg Symbol".blue_bt} font successfully created! ${DIST_PATH}`);
      resolve(data);
    });
  });
};
