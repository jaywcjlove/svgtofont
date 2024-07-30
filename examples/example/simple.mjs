import svgtofont from '../../lib/index.js';
import path from 'path';

const rootPath = path.resolve(process.cwd(), "examples", "example");

svgtofont({
  src: path.resolve(rootPath, "svg"), // svg path
  dist: path.resolve(rootPath, "example"), // output path
  fontName: "svgtofont", // font name
  css: true, // Create CSS files.
  startNumber: 20000, // unicode start number
  emptyDist: true,
}).then(() => {
  console.log("done!!!!");
});