const svgtofont = require("../src");
const path = require("path");
const pkg = require('../package.json')

const rootPath = path.resolve(process.cwd(), "test");

svgtofont({
  src: path.resolve(rootPath, "svg"), // svg path
  dist: path.resolve(rootPath, "dist"), // output path
  fontName: "svgtofont", // font name
  css: true, // Create CSS files.
  startNumber: 20000, // unicode start number
  svgicons2svgfont: {
    fontHeight: 1000,
    normalize: true
  },
  // website = null, no demo html files
  website: {
    index: "unicode", // Enum{"font-class", "unicode", "symbol"}
    title: "svgtofont",
    favicon: path.resolve(rootPath, "favicon.png"),
    // Must be a .svg format image.
    logo: path.resolve(rootPath, "svg", "git.svg"),
    version: pkg.version,
    meta: {
      description: "Converts SVG fonts to TTF/EOT/WOFF/WOFF2/SVG format.",
      keywords: "svgtofont,TTF,EOT,WOFF,WOFF2,SVG"
    },
    description: ``,
    links: [
      {
        title: "GitHub",
        url: "https://github.com/jaywcjlove/svgtofont"
      },
      {
        title: "Feedback",
        url: "https://github.com/jaywcjlove/svgtofont/issues"
      },
      {
        title: "Font Class",
        url: "font-class.html"
      },
      {
        title: "Unicode",
        url: "index.html"
      }
    ],
    footerInfo: `Licensed under MIT. (Yes it's free and <a target="_blank" href="https://github.com/jaywcjlove/svgtofont">open-sourced</a>)`
  }
}).then(() => {
  console.log("done!!!!");
});
