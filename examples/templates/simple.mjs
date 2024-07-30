import path from 'path';
import svgtofont from '../../lib/index.js';

const rootPath = path.resolve(process.cwd(), "examples", "templates");

svgtofont({
  config: {
    cwd: rootPath,
  },
  src: path.resolve(rootPath, "svg"), // svg path
  dist: path.resolve(rootPath, "dist3"), // output path
  fontName: "svgtofont", // font name
  css: true, // Create CSS files.
  startNumber: 20000, // unicode start number
  emptyDist: true,
}).then(() => {
  console.log("done!!!!");
});