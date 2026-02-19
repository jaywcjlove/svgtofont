import svgtofont from '../../lib/index.js';
import path from 'path';

const rootPath = path.resolve(process.cwd(), "examples", "multicolor");

svgtofont({
  src: path.resolve(rootPath, "svg"), // svg path
  dist: path.resolve(rootPath, "dist"), // output path
  fontName: "multicolor-font", // font name
  css: true, // Create CSS files.
  multicolor: true, // Enable multicolor icon support
  emptyDist: true,
  svgicons2svgfont: {
    fontHeight: 1000,
    normalize: true,
  },
  website: {
    index: "font-class",
    title: "Multicolor Icons Demo",
    description: "Demonstration of multicolor icon font support",
    links: [
      {
        title: "Font Class Demo",
        url: "index.html"
      },
      {
        title: "Unicode Demo",
        url: "unicode.html"
      },
      {
        title: "Symbol Demo",
        url: "symbol.html"
      }
    ],
  }
}).then(() => {
  console.log("done!!!!");
});
