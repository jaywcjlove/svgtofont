import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'fs-extra';
import path from 'path';

const execFileAsync = promisify(execFile);

// `npm test` builds these in `pretest`. `npm run coverage` does not, so create
// any missing example output before reading it.
async function ensureExampleOutput(script, dist) {
  if (await fs.pathExists(dist)) return;
  await execFileAsync(process.execPath, [script], { cwd: process.cwd() });
}

const exampleDist = path.resolve(process.cwd(), 'examples', 'example', 'dist');
const exampleSimpleDist = path.resolve(process.cwd(), 'examples', 'example', 'example');
const templatesDist = path.resolve(process.cwd(), 'examples', 'templates', 'dist2');

beforeAll(async () => {
  await ensureExampleOutput('examples/example/index.mjs', exampleDist);
  await ensureExampleOutput('examples/example/simple.mjs', exampleSimpleDist);
  await ensureExampleOutput('examples/templates/index.mjs', templatesDist);
}, 120000);

it('example test case.', async () => {
  const fileNames = (await fs.readdir(exampleDist)).sort();
  expect(fileNames).toEqual([
    'font-class.html',
    'index.html',
    'react',
    'reactNative',
    'svgtofont.css',
    'svgtofont.d.ts',
    'svgtofont.eot',
    'svgtofont.json',
    'svgtofont.less',
    'svgtofont.module.less',
    'svgtofont.scss',
    'svgtofont.styl',
    'svgtofont.svg',
    'svgtofont.symbol.svg',
    'svgtofont.ttf',
    'svgtofont.woff',
    'svgtofont.woff2',
    'symbol.html',
    'vue',
  ]);
});

it('example simple test case.', async () => {
  const fileNames = (await fs.readdir(exampleSimpleDist)).sort();
  expect(fileNames).toEqual([
    'svgtofont.css',
    'svgtofont.eot',
    'svgtofont.less',
    'svgtofont.module.less',
    'svgtofont.scss',
    'svgtofont.styl',
    'svgtofont.svg',
    'svgtofont.symbol.svg',
    'svgtofont.ttf',
    'svgtofont.woff',
    'svgtofont.woff2',
  ]);
})

it('templates templates test case.', async () => {
  const fileNames = (await fs.readdir(templatesDist)).sort();
  expect(fileNames).toEqual([
    'font-class.html',
    'index.html',
    'react',
    'reactNative',
    'svgtofont.css',
    'svgtofont.eot',
    'svgtofont.json',
    'svgtofont.less',
    'svgtofont.module.less',
    'svgtofont.scss',
    'svgtofont.styl',
    'svgtofont.svg',
    'svgtofont.symbol.svg',
    'svgtofont.ttf',
    'svgtofont.woff',
    'svgtofont.woff2',
    'symbol.html',
    'vue'
  ]);
  const css = await fs.readFile(path.resolve(templatesDist, 'svgtofont.css'));
  expect(css.toString().indexOf('Hello CSS!') > -1).toBeTruthy();
})
