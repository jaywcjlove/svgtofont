import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from '../package.json';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const pkg = fs.readJSONSync(path.resolve(__dirname, "../package.json"));

// const fs = require('fs-extra');
// const path = require('path');
// const svgtofont = require('../lib/index.js');

it('example test case.', async () => {
  const dist = path.resolve(process.cwd(), 'examples', 'example', 'dist');
  const fileNames = await fs.readdir(dist);
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
    'symbol.html'
  ]);
});

it('example simple test case.', async () => {
  const dist = path.resolve(process.cwd(), 'examples', 'example', 'example');
  const fileNames = await fs.readdir(dist);
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
  const dist = path.resolve(process.cwd(), 'examples', 'templates', 'dist2');
  const fileNames = await fs.readdir(dist);
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
    'symbol.html'
  ]);
  const css = await fs.readFile(path.resolve(dist, 'svgtofont.css'));
  expect(css.toString().indexOf('Hello CSS!') > -1).toBeTruthy();
})
