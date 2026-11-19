/**
 * Node streams (svgicons2svgfont → sax) call `dest.destroy`.
 * jsdom's stream shim does not implement it, so these tests run in Node.
 * @jest-environment node
 */
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import svgtofont from '../src/index.js';
import { log, Log } from '../src/log.js';
import {
  analyzeSvgColors,
  generateLayerSvgs,
  normalizeColor,
} from '../src/multicolor.js';
import {
  copyTemplate,
  createEOT,
  createSVG,
  createSvgSymbol,
  createTTF,
  createWOFF,
  createWOFF2,
  filterSvgFiles,
  generateFontFaceCSS,
  snakeToUppercase,
  toEnumMember,
  toPascalCase,
} from '../src/utils.js';

// Not named `require`: Jest rewrites `import.meta.url` with a `require()` call,
// which hits the temporal dead zone of `const require = ...`.
const nodeRequire = createRequire(import.meta.url);
const repoRoot = process.cwd();
const PATH_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 2h20v20H2z"/></svg>';
const XML_SVG = `<?xml version="1.0" encoding="UTF-8"?>\n${PATH_SVG}`;
const HEART_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <path fill="#ff4444" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  <path fill="#cc0000" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09V21.35z"/>
</svg>`;

const roots = [];

function tempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'svgtofont-cov-'));
  roots.push(dir);
  return dir;
}

async function waitForFile(file, timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await fs.pathExists(file)) return;
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
  throw new Error(`Timed out waiting for ${file}`);
}

describe('normalizeColor', () => {
  it('canonicalizes hex, rgb, and named colors', () => {
    expect(normalizeColor('')).toBe('#000000');
    expect(normalizeColor('  NONE ')).toBe('none');
    expect(normalizeColor('transparent')).toBe('none');
    expect(normalizeColor('currentColor')).toBe('currentColor');
    expect(normalizeColor('#abc')).toBe('#aabbcc');
    expect(normalizeColor('#FF00AA')).toBe('#ff00aa');
    expect(normalizeColor('rgb(1, 2, 3)')).toBe('#010203');
    expect(normalizeColor('rgba(4, 5, 6, 0.4)')).toBe('#040506');
    expect(normalizeColor('Red')).toBe('#ff0000');
    expect(normalizeColor('url(#grad)')).toBe('url(#grad)');
  });
});

describe('analyzeSvgColors', () => {
  it('splits visible fills and keeps ancestor transforms', () => {
    const analysis = analyzeSvgColors(`<svg xmlns="http://www.w3.org/2000/svg" width="10" height="12" viewBox="0 0 10 12">
      <path fill="none" d="M0 0h1v1H0z"/>
      <path fill="transparent" d="M0 0h1v1H0z"/>
      <path fill="url(#g)" d="M0 0h1v1H0z"/>
      <path fill="#abc" d="M0 0h1v1H0z"/>
      <path fill="red" d="M1 0h1v1H1z"/>
      <path fill="rgb(1, 2, 3)" d="M2 0h1v1H2z"/>
      <path fill="currentColor" d="M3 0h1v1H3z"/>
      <path d="M4 0h1v1H4z"/>
      <g>
        <g fill="#00ff00" transform="translate(1 2)">
          <g transform="scale(2)">
            <circle cx="1" cy="1" r="1"/>
          </g>
          <circle cx="2" cy="2" r="1"/>
        </g>
      </g>
    </svg>`);

    expect(analysis.viewBox).toBe('0 0 10 12');
    expect(analysis.width).toBe('10');
    expect(analysis.height).toBe('12');
    expect(analysis.isMulticolor).toBe(true);
    const colors = analysis.colorGroups.map((group) => group.color).sort();
    expect(colors).toEqual([
      '#000000',
      '#00ff00',
      '#aabbcc',
      '#ff0000',
      '#010203',
      'currentColor',
    ].sort());

    const green = analysis.colorGroups.find((group) => group.color === '#00ff00');
    expect(green.elements[0]).toContain('translate(1 2)');
    expect(green.elements[0]).toContain('scale(2)');
    expect(green.elements[0]).not.toContain('fill=');

    const bare = analyzeSvgColors('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h1v1H0z"/></svg>');
    expect(bare.isMulticolor).toBe(false);
    expect(bare.viewBox).toBe('0 0 24 24');
    expect(bare.width).toBe('24');
    expect(bare.height).toBe('24');
    expect(bare.colorGroups).toEqual([
      expect.objectContaining({ color: '#000000' }),
    ]);

    const layers = generateLayerSvgs(analysis);
    expect(layers).toHaveLength(analysis.colorGroups.length);
    expect(layers[0].svgContent).toContain(`viewBox="${analysis.viewBox}"`);
    expect(layers[0].svgContent).toContain('width="10"');
    expect(layers[0].color).toBe(analysis.colorGroups[0].color);
  });
});

describe('font helpers', () => {
  it('builds @font-face rules for the selected formats', () => {
    const stamped = generateFontFaceCSS('ic', 'fonts/', 9, [], true);
    expect(stamped).toContain("fonts/ic.eot?t=9");
    expect(stamped).toContain("?t=9#iefix");
    expect(stamped).toContain("fonts/ic.woff2?t=9");

    const named = generateFontFaceCSS('ic', '', 9, ['woff', 'svg'], 'v1');
    expect(named).toContain('?t=v1');
    expect(named).toContain('.woff2');
    expect(named).not.toMatch(/\.woff(?!2)/);
    expect(named).not.toContain('.svg');

    const plain = generateFontFaceCSS('ic', '', 9, ['eot'], false);
    expect(plain).not.toContain('?t=');
    expect(plain).not.toContain('.eot');
    expect(plain).toContain(".ttf') format('truetype')");

    const ieFix = generateFontFaceCSS('ic', '', 9, [], false);
    expect(ieFix).toContain(".eot?#iefix");

    const none = generateFontFaceCSS('ic', 'fonts/', 1, ['eot', 'woff', 'woff2', 'ttf', 'svg'], false);
    expect(none).toBe('  font-family: "ic";\n  src: ;');
  });

  it('copies only the included template files', async () => {
    const root = tempDir();
    const styles = path.join(root, 'styles');
    const out = path.join(root, 'out');
    await fs.ensureDir(path.join(styles, 'nested'));
    await fs.writeFile(path.join(styles, 'nested', 'skip.txt'), 'nope');
    await fs.writeFile(path.join(styles, '_{{filename}}.css'), '/* {{note}} */\n{{fontFamily}}\n{{cssPath}}\n');
    await fs.writeFile(path.join(styles, '_{{filename}}.less'), 'skip');

    await copyTemplate(styles, out, {
      _opts: {
        include: /\.css$/,
        cssPath: '/fonts/',
        fileName: 'icons',
        templateVars: { note: 'hello' },
      },
      fontname: 'ic',
      fontFamily: 'family-body',
    });

    const css = await fs.readFile(path.join(out, 'icons.css'), 'utf8');
    expect(css).toContain('/* hello */');
    expect(css).toContain('family-body');
    expect(css).toContain('/fonts/');
    expect(await fs.pathExists(path.join(out, 'icons.less'))).toBe(false);
  });

  it('lists only svg files and rejects an unreadable folder', () => {
    const root = tempDir();
    const src = path.join(root, 'svg');
    fs.ensureDirSync(src);
    fs.writeFileSync(path.join(src, 'git.svg'), PATH_SVG);
    fs.writeFileSync(path.join(src, 'notes.txt'), 'x');
    expect(filterSvgFiles(src)).toEqual([path.join(src, 'git.svg')]);

    const spy = jest.spyOn(fs, 'readdirSync');
    try {
      spy.mockReturnValueOnce(null);
      expect(() => filterSvgFiles(src)).toThrow(/Svg folder is empty/);
      spy.mockReturnValueOnce(['notes.txt', 1, 'git.svg', 'git.svg']);
      expect(filterSvgFiles(src)).toEqual([path.join(src, 'git.svg')]);
    } finally {
      spy.mockRestore();
    }
  });

  it('pascal-cases icon names and enum members', () => {
    expect(toPascalCase('some-mixed_string with spaces')).toBe('SomeMixedStringWithSpaces');
    expect(toPascalCase('react')).toBe('React');
    expect(snakeToUppercase('foo-bar_baz')).toBe('FooBarBaz');
    expect(toEnumMember('arrow-left')).toBe('ArrowLeft');
    expect(toEnumMember('my_icon')).toBe('MyIcon');
    expect(toEnumMember('24')).toBe('_24');
    expect(toEnumMember('$ok')).toBe('$ok');
  });
});

describe('Log', () => {
  afterEach(() => {
    log.disabled = false;
    log.logger = () => {};
  });

  it('prints, forwards to a logger, and stays quiet when disabled', () => {
    const quiet = new Log(true);
    const logger = jest.fn();
    quiet.logger = logger;
    expect(quiet.disabled).toBe(true);
    expect(quiet.log('hidden', 1)).toEqual(expect.any(Function));
    expect(quiet.error('hidden-error', 2)).toEqual(expect.any(Function));
    expect(logger).toHaveBeenCalledWith('hidden');
    expect(logger).toHaveBeenCalledWith('hidden-error');

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    quiet.disabled = false;
    quiet.logger = undefined;
    quiet.log('shown', 3);
    quiet.error('shown-error', 5);
    quiet.logger = logger;
    quiet.error('boom', 4);
    expect(logSpy).toHaveBeenCalledWith('shown', 3);
    expect(errorSpy).toHaveBeenCalledWith('shown-error', 5);
    expect(errorSpy).toHaveBeenCalledWith('boom', 4);
    logSpy.mockRestore();
    errorSpy.mockRestore();

    log.logger = logger;
    log.disabled = false;
    log.log('direct');
    expect(logger).toHaveBeenCalledWith('direct');
  });
});

describe('svgtofont options', () => {
  const originalLogger = log.logger;

  afterEach(async () => {
    process.chdir(repoRoot);
    log.logger = originalLogger;
    log.disabled = false;
    await Promise.all(roots.splice(0).map((dir) => fs.remove(dir)));
  });

  it('builds multicolor icons, components, and a demo site', async () => {
    const root = tempDir();
    const src = path.join(root, 'svg');
    const dist = path.join(root, 'dist');
    const cssDir = path.join(root, 'css');
    const styles = path.join(root, 'styles');
    await fs.ensureDir(src);
    await fs.ensureDir(path.join(styles, 'nested'));
    await fs.writeFile(path.join(styles, 'nested', 'skip.txt'), 'nope');
    await fs.writeFile(path.join(styles, '_{{filename}}.css'), '/* {{note}} */\n{{fontFamily}}\n{{fontSize}}\n{{cssString}}\n');
    await fs.writeFile(path.join(styles, '_{{filename}}.less'), 'skip-me');
    await fs.writeFile(path.join(src, 'heart.svg'), HEART_SVG);
    await fs.writeFile(path.join(src, 'git.svg'), XML_SVG);
    await fs.writeFile(path.join(src, 'react.svg'), PATH_SVG);
    await fs.writeFile(path.join(src, 'vue.svg'), PATH_SVG);
    await fs.writeFile(path.join(src, '24.svg'), PATH_SVG);
    await fs.writeFile(path.join(src, 'rect.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="black"/></svg>');
    await fs.writeFile(path.join(src, 'notes.txt'), 'ignore');

    const messages = [];
    process.chdir(root);
    await svgtofont({
      src,
      dist,
      fontName: 'ic',
      classNamePrefix: 'icon',
      symbolNameDelimiter: '_',
      useCSSVars: true,
      generateInfoData: true,
      typescript: { extension: 'ts', enumName: 'Ico' },
      multicolor: true,
      emptyDist: true,
      excludeFormat: ['woff2'],
      svgoOptions: { plugins: ['cleanupIds'] },
      styleTemplates: styles,
      logger: (message) => messages.push(message),
      css: {
        output: cssDir,
        include: /\.css$/,
        cssPath: '/fonts/',
        fileName: 'icons',
        hasTimestamp: false,
        fontSize: '18px',
        templateVars: { note: 'note' },
      },
      outSVGPath: true,
      outSVGReact: true,
      outSVGReactNative: true,
      outSVGVue: true,
      website: {
        index: 'unicode',
        title: 'Icons',
        logo: path.join(repoRoot, 'examples/example/svg/git.svg'),
        favicon: path.join(repoRoot, 'examples/example/favicon.png'),
        template: path.join(repoRoot, 'src/website/index.njk'),
        links: [{ title: 'Home', url: 'index.html' }],
      },
    });

    const css = await fs.readFile(path.join(cssDir, 'icons.css'), 'utf8');
    expect(css).toContain('/* note */');
    expect(css).toContain('/fonts/');
    expect(css).not.toContain('?t=');
    expect(css).toContain(':root');
    expect(css).toContain('--icon_git');
    expect(css).toContain('.icon_heart .path1::before');
    expect(css).toContain('.icon_heart .path2::before');
    expect(css).toContain('margin-left: -1em');
    expect(css).toContain('font-size: 18px;');
    expect(await fs.pathExists(path.join(cssDir, 'icons.less'))).toBe(false);
    expect(await fs.pathExists(path.join(dist, 'ic.woff2'))).toBe(false);

    const info = await fs.readJson(path.join(dist, 'info.json'));
    expect(info.heart.multicolor).toBe(true);
    expect(info.heart.layers.map((layer) => layer.path)).toEqual(['path1', 'path2']);
    expect(info.git.className).toBe('icon_git');

    const react = await fs.readFile(path.join(dist, 'react', 'ReactIcon.js'), 'utf8');
    const vue = await fs.readFile(path.join(dist, 'vue', 'VueIcon.js'), 'utf8');
    const digit = await fs.readFile(path.join(dist, 'react', '24.js'), 'utf8');
    const native = await fs.readFile(path.join(dist, 'reactNative', 'icon.jsx'), 'utf8');
    expect(react).toContain('width="18px"');
    expect(react).toContain('export const ReactIcon');
    expect(digit).toContain('export const Icon24');
    expect(vue).toContain("width: '18px'");
    expect(vue).toContain('h(\'path\'');
    expect(native).toContain('fontSize: 18');
    expect(native).toContain('"_24"');

    const dts = await fs.readFile(path.join(dist, 'ic.ts'), 'utf8');
    expect(dts).toContain('export enum Ico');
    expect(await fs.pathExists(path.join(dist, 'ic.json'))).toBe(true);

    const indexHtml = await fs.readFile(path.join(dist, 'index.html'), 'utf8');
    const fontClassHtml = await fs.readFile(path.join(dist, 'font-class.html'), 'utf8');
    expect(indexHtml).toContain('unicode-icon');
    expect(indexHtml).toContain('data:image');
    expect(fontClassHtml).toContain('icons.css');
    expect(fontClassHtml).toContain('class-icon');
    expect(fontClassHtml).toContain('path1');
    expect(messages.some((message) => String(message).includes('SUCCESS'))).toBe(true);
  }, 30000);

  it('turns website output on when css is disabled and drops excluded formats', async () => {
    const root = tempDir();
    const src = path.join(root, 'svg');
    const dist = path.join(root, 'dist');
    await fs.ensureDir(src);
    await fs.writeFile(path.join(src, 'git.svg'), PATH_SVG);
    process.chdir(root);

    await svgtofont({
      src,
      dist,
      fontName: 'ic',
      css: false,
      log: true,
      emptyDist: true,
      excludeFormat: ['eot', 'woff', 'woff2', 'ttf', 'svg', 'symbol.svg'],
      getIconUnicode: () => null,
      outSVGReact: true,
      outSVGVue: true,
      website: {
        index: 'nope',
        links: [],
        logo: path.join(repoRoot, 'examples/example/favicon.png'),
        corners: { url: 'https://example.com/repo', width: 80, bgColor: '#123456' },
      },
    });

    expect(await fs.pathExists(path.join(dist, 'ic.css'))).toBe(true);
    expect(await fs.pathExists(path.join(dist, 'ic.ttf'))).toBe(false);
    expect(await fs.pathExists(path.join(dist, 'ic.svg'))).toBe(false);
    expect(await fs.pathExists(path.join(dist, 'ic.eot'))).toBe(false);
    expect(await fs.pathExists(path.join(dist, 'ic.symbol.svg'))).toBe(false);
    const html = await fs.readFile(path.join(dist, 'index.html'), 'utf8');
    expect(html).toContain('class-icon');
    expect(html).toContain('github-corner');
    expect(html).toContain('https://example.com/repo');
    expect(html).toContain('width="80"');
    expect(html).toContain('#123456');
    const react = await fs.readFile(path.join(dist, 'react', 'Git.js'), 'utf8');
    const vue = await fs.readFile(path.join(dist, 'vue', 'Git.js'), 'utf8');
    expect(react).not.toContain('width=');
    expect(vue).not.toContain('width:');
  }, 30000);

  it('uses a boolean font size for generated components', async () => {
    const root = tempDir();
    const src = path.join(root, 'svg');
    const dist = path.join(root, 'dist');
    await fs.ensureDir(src);
    await fs.writeFile(path.join(src, 'git.svg'), PATH_SVG);
    process.chdir(root);

    await svgtofont({
      src,
      dist,
      fontName: 'ic',
      emptyDist: true,
      log: false,
      excludeFormat: ['eot', 'woff', 'woff2', 'symbol.svg'],
      css: { fontSize: true },
      outSVGReact: true,
      outSVGVue: true,
      outSVGReactNative: true,
      getIconUnicode: () => ['A', 0xeb00],
      website: {
        links: [],
        logo: path.join(root, 'missing.svg'),
        index: 'symbol',
      },
    });

    const react = await fs.readFile(path.join(dist, 'react', 'Git.js'), 'utf8');
    const vue = await fs.readFile(path.join(dist, 'vue', 'Git.js'), 'utf8');
    const native = await fs.readFile(path.join(dist, 'reactNative', 'ic.jsx'), 'utf8');
    expect(react).toContain('width="16px"');
    expect(vue).toContain("width: '16px'");
    expect(native).toContain('fontSize: 16');
    const css = await fs.readFile(path.join(dist, 'ic.css'), 'utf8');
    expect(css).toContain('font-size: 16px;');
    const symbolPage = await fs.readFile(path.join(dist, 'index.html'), 'utf8');
    expect(symbolPage).toContain('class="symbol"');

    const ttf = await fs.readFile(path.join(dist, 'ic.ttf'));
    const failWrite = jest.spyOn(fs, 'writeFile').mockImplementation((file, data, cb) => {
      const callback = typeof cb === 'function' ? cb : (typeof data === 'function' ? data : null);
      if (callback) callback(Object.assign(new Error('disk full'), { code: 'ENOSPC' }));
    });
    try {
      await expect(createTTF({ dist, fontName: 'ic' })).rejects.toThrow('disk full');
      await expect(createEOT({ dist, fontName: 'ic' }, ttf)).rejects.toThrow('disk full');
      await expect(createWOFF({ dist, fontName: 'ic' }, ttf)).rejects.toThrow('disk full');
      await expect(createWOFF2({ dist, fontName: 'ic' }, ttf)).rejects.toThrow('disk full');
      await expect(createSvgSymbol({ src, dist, fontName: 'ic', classNamePrefix: 'ic' })).rejects.toThrow('disk full');
    } finally {
      failWrite.mockRestore();
    }
  }, 30000);

  it('keeps an explicit website version when package.json also defines one', async () => {
    const root = tempDir();
    const src = path.join(root, 'svg');
    const dist = path.join(root, 'dist');
    await fs.ensureDir(src);
    await fs.writeJson(path.join(root, 'package.json'), {
      version: '9.9.9',
      svgtofont: { css: { fontSize: '22px' } },
    });
    await fs.writeFile(path.join(src, 'git.svg'), PATH_SVG);
    process.chdir(root);

    await svgtofont({
      src,
      dist,
      fontName: 'ic',
      emptyDist: true,
      log: false,
      css: { fontSize: '12px', fileName: 'kept', hasTimestamp: false },
      website: {
        links: [],
        version: '1.2.3',
        description: 'Demo icons',
        meta: { keywords: 'icon,font' },
      },
    });

    const css = await fs.readFile(path.join(dist, 'kept.css'), 'utf8');
    expect(css).toContain('font-size: 22px;');
    expect(css).not.toContain('font-size: 12px;');
    const html = await fs.readFile(path.join(dist, 'index.html'), 'utf8');
    expect(html).toContain('<sup>1.2.3</sup>');
    expect(html).toContain('Demo icons');
    expect(html).toContain('name="keywords" content="icon,font"');
    expect(html).not.toContain('9.9.9');
  }, 30000);

  it('skips style output when css and the website are off', async () => {
    const root = tempDir();
    const src = path.join(root, 'svg');
    const dist = path.join(root, 'dist');
    await fs.ensureDir(src);
    await fs.writeJson(path.join(root, 'package.json'), { name: 'no-config' });
    await fs.writeFile(path.join(src, 'git.svg'), PATH_SVG);
    process.chdir(root);

    const info = await svgtofont({
      src,
      dist,
      fontName: 'ic',
      css: false,
      website: null,
      log: false,
      emptyDist: false,
      excludeFormat: ['eot', 'woff', 'woff2', 'symbol.svg'],
      logger: 1,
    });

    expect(info.git.className).toBe('ic-git');
    expect(await fs.pathExists(path.join(dist, 'ic.css'))).toBe(false);
    expect(await fs.pathExists(path.join(dist, 'ic.ttf'))).toBe(true);
    expect(await fs.pathExists(path.join(dist, 'index.html'))).toBe(false);
  }, 30000);

  it('rethrows when the sources directory cannot be read', async () => {
    const root = tempDir();
    const messages = [];
    process.chdir(root);
    await expect(svgtofont({
      src: path.join(root, 'missing'),
      dist: path.join(root, 'dist'),
      fontName: 'ic',
      css: false,
      website: null,
      log: true,
      logger: (message) => messages.push(String(message)),
    })).rejects.toThrow(/ENOENT|no such file/i);
    expect(messages).toContain('SvgToFont:CLI:ERR:');
  });

  it('rejects when the svg font stream fails', async () => {
    const root = tempDir();
    const src = path.join(root, 'svg');
    const dist = path.join(root, 'dist');
    await fs.ensureDir(src);
    await fs.ensureDir(dist);
    await fs.writeFile(path.join(src, 'git.svg'), PATH_SVG);
    const { Writable } = nodeRequire('node:stream');
    const failing = new Writable({
      write(chunk, encoding, callback) {
        callback(new Error('stream failed'));
      },
    });
    const spy = jest.spyOn(fs, 'createWriteStream').mockReturnValue(failing);
    try {
      await expect(createSVG({
        src,
        dist,
        fontName: 'ic',
        startUnicode: 0xea01,
        svgicons2svgfont: { fontName: 'ic' },
      })).rejects.toThrow('stream failed');
    } finally {
      spy.mockRestore();
    }
  }, 30000);
});

describe('cli', () => {
  const originalArgv = process.argv.slice();

  afterEach(async () => {
    process.argv = originalArgv;
    jest.restoreAllMocks();
    await Promise.all(roots.splice(0).map((dir) => fs.remove(dir)));
  });

  it('exits when the sources directory does not exist', () => {
    const output = path.join(tempDir(), 'out');
    process.argv = ['node', 'svgtofont', '--sources', path.join(tempDir(), 'missing'), '--output', output];
    jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      jest.isolateModules(() => {
        nodeRequire('../src/cli.ts');
      });
    }).toThrow(/process.exit/);
    expect(errorSpy).toHaveBeenCalledWith('The directory does not exist!', expect.any(String));
  });

  it('creates a missing output directory and writes the font', async () => {
    const root = tempDir();
    const src = path.join(root, 'svg');
    const dist = path.join(root, 'out');
    await fs.ensureDir(src);
    await fs.writeFile(path.join(src, 'git.svg'), PATH_SVG);
    process.argv = ['node', 'svgtofont', '-s', src, '-o', dist, '-f', 'CliFont', '--multicolor'];
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    jest.isolateModules(() => {
      nodeRequire('../src/cli.ts');
    });

    await waitForFile(path.join(dist, 'vue', 'index.js'));
    expect(await fs.pathExists(path.join(dist, 'CliFont.ttf'))).toBe(true);
    expect(await fs.pathExists(path.join(dist, 'react', 'index.js'))).toBe(true);
    expect(console.log).toHaveBeenCalledWith('done!');
  }, 30000);

  it('logs when an icon name cannot be normalized', async () => {
    const root = tempDir();
    const src = path.join(root, 'svg');
    const dist = path.join(root, 'out');
    await fs.ensureDir(src);
    await fs.ensureDir(dist);
    await fs.writeFile(path.join(src, '+++.svg'), PATH_SVG);
    process.argv = ['node', 'svgtofont', '-s', src, '-o', dist];
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    jest.isolateModules(() => {
      nodeRequire('../src/cli.ts');
    });

    const start = Date.now();
    while (Date.now() - start < 20000) {
      const logged = logSpy.mock.calls.some((args) => args[0] === 'SvgToFont:ERR:');
      if (logged) break;
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    expect(logSpy).toHaveBeenCalledWith('SvgToFont:CLI:ERR:', expect.any(Error));
    expect(logSpy).toHaveBeenCalledWith('SvgToFont:ERR:', expect.any(Error));
  }, 30000);
});
