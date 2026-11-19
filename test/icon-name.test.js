/**
 * Node streams (svgicons2svgfont → sax) call `dest.destroy`.
 * jsdom's stream shim does not implement it, so these tests run in Node.
 * @jest-environment node
 */
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import svgtofont from '../src/index.js';
import { listIconFiles, normalizeIconName } from '../src/utils.js';

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 2h20v20H2z"/></svg>';

/** SVG fonts store ligature text as numeric character references. */
function decodeXmlChars(value) {
  return value
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(Number(dec)));
}

async function writeIcons(dir, names) {
  await fs.ensureDir(dir);
  await Promise.all(names.map((name) => fs.writeFile(path.join(dir, `${name}.svg`), SVG)));
}

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'svgtofont-'));
}

describe('normalizeIconName', () => {
  it('keeps names that are already valid identifiers', () => {
    expect(normalizeIconName('git')).toBe('git');
    expect(normalizeIconName('arrow-left')).toBe('arrow-left');
    expect(normalizeIconName('my_icon')).toBe('my_icon');
    expect(normalizeIconName('foo--bar')).toBe('foo--bar');
  });

  it('replaces characters that break CSS selectors and SCSS variables', () => {
    expect(normalizeIconName('arrow.left')).toBe('arrow-left');
    expect(normalizeIconName('zoom+in')).toBe('zoom-in');
    expect(normalizeIconName('my icon')).toBe('my-icon');
    expect(normalizeIconName('a"b')).toBe('a-b');
    expect(normalizeIconName("it's")).toBe('it-s');
    expect(normalizeIconName('my  icon')).toBe('my-icon');
  });

  it('trims extra hyphens and prefixes a leading digit', () => {
    expect(normalizeIconName('-keep-')).toBe('keep');
    expect(normalizeIconName('24')).toBe('_24');
    expect(normalizeIconName('1arrow')).toBe('_1arrow');
  });

  it('returns an empty string when nothing usable remains', () => {
    expect(normalizeIconName('+++')).toBe('');
    expect(normalizeIconName('...')).toBe('');
    expect(normalizeIconName('图标')).toBe('');
  });
});

describe('listIconFiles', () => {
  let root;

  afterEach(async () => {
    if (root) await fs.remove(root);
  });

  it('rejects names that normalize to the same identifier', async () => {
    root = tempDir();
    const src = path.join(root, 'icons');
    await writeIcons(src, ['arrow.left', 'arrow-left', '24', '_24']);
    expect(() => listIconFiles(src)).toThrow(/"arrow\.left"/);
    expect(() => listIconFiles(src)).toThrow(/"arrow-left"/);
    expect(() => listIconFiles(src)).toThrow(/→ "arrow-left"/);
    expect(() => listIconFiles(src)).toThrow(/"24"/);
    expect(() => listIconFiles(src)).toThrow(/"_24"/);
    expect(() => listIconFiles(src)).toThrow(/→ "_24"/);
  });

  it('rejects a file name that cannot become an identifier', async () => {
    root = tempDir();
    const src = path.join(root, 'icons');
    await writeIcons(src, ['+++']);
    expect(() => listIconFiles(src)).toThrow(/Cannot derive a valid icon name from "\+\+\+"/);
  });
});

describe('svgtofont icon names', () => {
  let root;

  afterEach(async () => {
    if (root) await fs.remove(root);
  });

  it('uses one safe name in styles, preview HTML, info.json, symbols, and typescript', async () => {
    root = tempDir();
    const src = path.join(root, 'icons');
    const dist = path.join(root, 'out');
    const originals = ['arrow.left', 'zoom+in', 'my icon', 'a"b', '24', 'git', 'foo--bar'];
    await writeIcons(src, originals);
    const seen = [];

    await svgtofont({
      src,
      dist,
      fontName: 'ic',
      css: true,
      generateInfoData: true,
      typescript: true,
      outSVGPath: true,
      outSVGReactNative: true,
      emptyDist: true,
      log: false,
      website: { links: [] },
      getIconUnicode(name, unicode, startUnicode) {
        seen.push(name);
        return [unicode, startUnicode];
      },
    });

    expect(seen.slice().sort()).toEqual(originals.slice().sort());

    const info = await fs.readJson(path.join(dist, 'info.json'));
    expect(Object.keys(info).sort()).toEqual(
      ['arrow-left', 'zoom-in', 'my-icon', 'a-b', '_24', 'git', 'foo--bar'].sort(),
    );
    for (const [name, icon] of Object.entries(info)) {
      expect(icon.className).toBe(`ic-${name}`);
    }

    const css = await fs.readFile(path.join(dist, 'ic.css'), 'utf8');
    const less = await fs.readFile(path.join(dist, 'ic.less'), 'utf8');
    const moduleLess = await fs.readFile(path.join(dist, 'ic.module.less'), 'utf8');
    const scss = await fs.readFile(path.join(dist, 'ic.scss'), 'utf8');
    const styl = await fs.readFile(path.join(dist, 'ic.styl'), 'utf8');
    const html = await fs.readFile(path.join(dist, 'index.html'), 'utf8');
    const symbol = await fs.readFile(path.join(dist, 'ic.symbol.svg'), 'utf8');
    const dts = await fs.readFile(path.join(dist, 'ic.d.ts'), 'utf8');
    const paths = JSON.parse(await fs.readFile(path.join(dist, 'ic.json'), 'utf8'));
    const native = await fs.readFile(path.join(dist, 'reactNative', 'ic.jsx'), 'utf8');

    for (const [name, icon] of Object.entries(info)) {
      const rule = `.${icon.className}::before { content: "${icon.encodedCode}"; }`;
      expect(css).toContain(rule);
      expect(less).toContain(rule);
      expect(moduleLess).toContain(rule);
      expect(scss).toContain(`$ic-${name}: '${icon.encodedCode}';`);
      expect(styl).toContain(`$ic-${name} = '${icon.encodedCode}'`);
      expect(html).toContain(`<i class="${icon.className}"></i>`);
      expect(symbol).toContain(`id="${icon.className}"`);
    }

    expect(css).not.toContain('arrow.left');
    expect(css).not.toContain('zoom+');
    expect(css).not.toContain('my icon');
    expect(css).not.toContain('a"b');
    expect(scss).not.toContain('$ic-arrow.left');
    expect(scss).not.toContain('$ic-zoom+in');
    expect(scss).not.toContain('$ic-my icon');
    expect(html).not.toContain('class="ic-arrow.left"');
    expect(html).not.toContain('class="ic-my icon"');
    expect(html).not.toContain('class="ic-zoom+in"');

    expect(Object.keys(paths).sort()).toEqual(Object.keys(info).sort());
    expect(native).toContain('"arrow-left"');
    expect(native).toContain('"foo--bar"');
    expect(native).not.toContain('"arrow.left"');
    expect(native).not.toContain('"my icon"');

    expect(dts).toContain('ArrowLeft = "ic-arrow-left"');
    expect(dts).toContain('ZoomIn = "ic-zoom-in"');
    expect(dts).toContain('MyIcon = "ic-my-icon"');
    expect(dts).toContain('AB = "ic-a-b"');
    expect(dts).toContain('_24 = "ic-_24"');
    expect(dts).toContain('Git = "ic-git"');
    expect(dts).toContain('FooBar = "ic-foo--bar"');
    expect(dts).not.toContain('arrow.left');
    expect(dts).not.toContain('zoom+in');
  });

  it('keeps the original file name as the ligature text', async () => {
    root = tempDir();
    const src = path.join(root, 'icons');
    const dist = path.join(root, 'out');
    await writeIcons(src, ['arrow.left', 'my icon']);

    await svgtofont({
      src,
      dist,
      fontName: 'ic',
      css: true,
      addLigatures: true,
      emptyDist: true,
      log: false,
      website: null,
    });

    const css = await fs.readFile(path.join(dist, 'ic.css'), 'utf8');
    const font = await fs.readFile(path.join(dist, 'ic.svg'), 'utf8');
    expect(css).toContain('.ic-arrow-left::before');
    expect(css).toContain('.ic-my-icon::before');
    expect(css).not.toContain('arrow.left');
    expect(css).not.toContain('my icon');
    expect(font).toContain('glyph-name="arrow-left"');
    expect(font).toContain('glyph-name="my-icon"');
    const ligatures = decodeXmlChars(font);
    expect(ligatures).toContain('arrow.left');
    expect(ligatures).toContain('my icon');
  });

  it('shows the original file name as unicode ligature text', async () => {
    root = tempDir();
    const src = path.join(root, 'icons');
    const dist = path.join(root, 'out');
    await writeIcons(src, ['my icon']);

    await svgtofont({
      src,
      dist,
      fontName: 'ic',
      css: true,
      useNameAsUnicode: true,
      emptyDist: true,
      log: false,
      website: { links: [] },
    });

    const css = await fs.readFile(path.join(dist, 'ic.css'), 'utf8');
    const html = await fs.readFile(path.join(dist, 'index.html'), 'utf8');
    expect(css).not.toContain('my icon');
    expect(css).not.toContain('.ic-my-icon::before');
    expect(html).toContain('<i class="ic">my icon</i>');
    expect(html).not.toContain('class="ic-my icon"');
  });

  it('rejects colliding file names instead of writing broken styles', async () => {
    root = tempDir();
    const src = path.join(root, 'icons');
    const dist = path.join(root, 'out');
    await writeIcons(src, ['arrow.left', 'arrow-left']);

    await expect(svgtofont({
      src,
      dist,
      fontName: 'ic',
      css: true,
      emptyDist: true,
      log: false,
      website: null,
    })).rejects.toThrow(/"arrow\.left"[\s\S]*"arrow-left"|"arrow-left"[\s\S]*"arrow\.left"/);
    expect(await fs.pathExists(path.join(dist, 'ic.css'))).toBe(false);
  });
});
