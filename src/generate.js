const fs = require("fs-extra");
const path = require('path');
const SVGO = require('svgo');
const { filterSvgFiles } = require('./utils');

const svgo = new SVGO({
  plugins: [{
    convertShapeToPath: { convertArcs: true },
  }],
});

module.exports.generateIconsSource = async (options) => {
  const ICONS_PATH = filterSvgFiles(options.src)
  const data = await buildPathsObject(ICONS_PATH);
  const outPath = path.join(options.dist, `${options.fontName}.json`);
  await fs.outputFile(outPath, `{${data}}`);
  return outPath;
}

/**
 * Loads SVG file for each icon, extracts path strings `d="path-string"`,
 * and constructs map of icon name to array of path strings.
 * @param {array} files
 */
async function buildPathsObject(files) {
  return Promise.all(
    files.map(async filepath => {
      const name = path.basename(filepath, '.svg');
      const svg = fs.readFileSync(filepath, 'utf-8');
      const pathStrings = await svgo.optimize(svg, { path: filepath })
        .then(({ data }) => data.match(/ d="[^"]+"/g) || [])
        .then(paths => paths.map(s => s.slice(3)));
      return `"${name}": [${pathStrings.join(',\n')}]`;
    }),
  );
}