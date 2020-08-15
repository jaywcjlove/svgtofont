const svgtofont = require("../../");
const path = require("path");

const rootPath = path.resolve(process.cwd(), "test", "example");

svgtofont({
  src: path.resolve(rootPath, "svg"), // svg path
  dist: path.resolve(rootPath, "dist"), // output path
  fontName: "svgtofont", // font name
  css: true, // Create CSS files.
  startNumber: 20000, // unicode start number
  emptyDist: true,
}).then(() => {
  console.log("done!!!!");
});