svg to font
---

[![](https://img.shields.io/github/issues/jaywcjlove/svgtofont.svg)](https://github.com/jaywcjlove/svgtofont/releases)
[![](https://img.shields.io/github/forks/jaywcjlove/svgtofont.svg)](https://github.com/jaywcjlove/svgtofont/network)
[![](https://img.shields.io/github/stars/jaywcjlove/svgtofont.svg)](https://github.com/jaywcjlove/svgtofont/stargazers)
[![](https://img.shields.io/github/release/jaywcjlove/svgtofont.svg)](https://github.com/jaywcjlove/svgtofont/releases)

Read a set of SVG icons and ouput a TTF/EOT/WOFF/WOFF2/SVG font, Generator of fonts from SVG icons.

[Install](#install) · [Usage](#using-with-nodejs) · [Command](#using-with-command) · [Font Usage](#font-usage) · [API](#api) · [options](#options) · [npm](http://npm.im/svgtofont) · [License](#license)

**Features:**  

- Supported font formats: `WOFF2`, `WOFF`, `EOT`, `TTF` and `SVG`.
- Support SVG Symbol file.
- Support [`Less`](https://github.com/less/less.js)/[`Sass`](https://github.com/sass/sass)/[`Stylus`](https://github.com/stylus/stylus).
- Allows to use custom templates (example `css`, `less` and etc).
- Automatically generate a preview site.

```bash
                                ╭┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈╮
                                ┆      Project       ┆
                                ┆                    ┆
╭┈┈┈┈┈┈┈┈╮                      ┆   ╭┈┈┈┈┈┈┈┈┈┈┈╮    ┆
┆iconfont┆┈┈╮                   ┆   ┆    svg    ┆┈┈╮ ┆
╰┈┈┈┈┈┈┈┈╯  ┆  ╭┈┈┈┈┈┈┈┈┈┈┈┈╮   ┆   ╰┈┈┈┈┈┈┈┈┈┈┈╯  ┆ ┆
            ├┈▶┆download svg┆┈┈▶┆   ╭┈┈┈┈┈┈┈┈┈┈┈╮  ┆ ┆
╭┈┈┈┈┈┈┈┈╮  ┆  ╰┈┈┈┈┈┈┈┈┈┈┈┈╯   ┆╭┈┈┆create font┆◀┈╯ ┆
┆icomoon ┆┈┈╯                   ┆┆  ╰┈┈┈┈┈┈┈┈┈┈┈╯    ┆
╰┈┈┈┈┈┈┈┈╯                      ┆┆  ╭┈┈┈┈┈┈┈┈┈┈┈╮    ┆
                                ┆╰┈▶┆ use font  ┆    ┆
                                ┆   ╰┈┈┈┈┈┈┈┈┈┈┈╯    ┆
                                ╰┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈╯
```

**Icon Font Created By svgtofont**

- [file-icons](https://uiwjs.github.io/file-icons/) File icons in the file tree.
- [uiw-iconfont](https://github.com/uiwjs/icons) The premium icon font for [@uiwjs](https://github.com/uiwjs) Component Library.
- [Bootstrap Icons Font](https://github.com/uiwjs/bootstrap-icons) Official open source SVG icon library for Bootstrap.
- [test example](./test) For a simple test example, run `npm run test` in the root directory to see the results.

## Install

```bash
npm i svgtofont
```

#### Using With Command

```json
{
  "scripts": {
    "font": "svgtofont --sources ./svg --output ./font --fontName uiw-font"
  },
}
```

You can add configuration to package.json. [#48](https://github.com/jaywcjlove/svgtofont/issues/48)

#### Using With Nodejs

```js
const svgtofont = require('svgtofont');
const path = require('path');
 
svgtofont({
  src: path.resolve(process.cwd(), 'icon'), // svg path
  dist: path.resolve(process.cwd(), 'fonts'), // output path
  fontName: 'svgtofont', // font name
  css: true, // Create CSS files.
}).then(() => {
  console.log('done!');
});
```

Or

```js
const svgtofont = require("svgtofont");
const path = require("path");

svgtofont({
  src: path.resolve(process.cwd(), "icon"), // svg path
  dist: path.resolve(process.cwd(), "fonts"), // output path
  fontName: "svgtofont", // font name
  css: true, // Create CSS files.
  startUnicode: 0xea01, // unicode start number
  svgicons2svgfont: {
    fontHeight: 1000,
    normalize: true
  },
  // website = null, no demo html files
  website: {
    title: "svgtofont",
    // Must be a .svg format image.
    logo: path.resolve(process.cwd(), "svg", "git.svg"),
    version: pkg.version,
    meta: {
      description: "Converts SVG fonts to TTF/EOT/WOFF/WOFF2/SVG format.",
      keywords: "svgtofont,TTF,EOT,WOFF,WOFF2,SVG"
    },
    description: ``,
    // Add a Github corner to your website
    // Like: https://github.com/uiwjs/react-github-corners
    corners: {
      url: 'https://github.com/jaywcjlove/svgtofont',
      width: 62, // default: 60
      height: 62, // default: 60
      bgColor: '#dc3545' // default: '#151513'
    },
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
        url: "index.html"
      },
      {
        title: "Unicode",
        url: "unicode.html"
      }
    ],
    footerInfo: `Licensed under MIT. (Yes it's free and <a href="https://github.com/jaywcjlove/svgtofont">open-sourced</a>`
  }
}).then(() => {
  console.log('done!');
});;
```

## API

```js
import { createSVG, createTTF, createEOT, createWOFF, createWOFF2, createSvgSymbol, copyTemplate, createHTML } from 'svgtofont/lib/utils';

const options = { ... };

async function creatFont() {
  const unicodeObject = await createSVG(options); 
  const ttf = await createTTF(options); // SVG Font => TTF
  await createEOT(options, ttf); // TTF => EOT
  await createWOFF(options, ttf); // TTF => WOFF
  await createWOFF2(options, ttf); // TTF => WOFF2
  await createSvgSymbol(options); // SVG Files => SVG Symbol
}
```

## options

> svgtofont(options)

### dist

> Type: `String`  
> Default value: ~~`dist`~~ => `fonts`  

The output directory.

### outSVGReact

> Type: `Boolean`  
> Default value: `false`  

Output `./dist/react/`, SVG generates `react` components.

```js
git/git.svg

// ↓↓↓↓↓↓↓↓↓↓

import React from 'react';
export const Git = props => (
  <svg viewBox="0 0 20 20" {...props}><path d="M2.6 10.59L8.38 4.8l1.69 -." fillRule="evenodd" /></svg>
);
```

### outSVGPath

> Type: `Boolean`  
> Default value: `false`  

Output `./dist/svgtofont.json`, The content is as follows:

```js
{
  "adobe": ["M14.868 3H23v19L14.868 3zM1 3h8.138L1 22V3zm.182 11.997H13.79l-1.551-3.82H8.447z...."],
  "git": ["M2.6 10.59L8.38 4.8l1.69 1.7c-.24.85.15 1.78.93 2.23v5.54c-.6.34-1 .99-1..."],
  "stylelint": ["M129.74 243.648c28-100.109 27.188-100.5.816c2.65..."]
}
```

Or you can generate the file separately: 

```js
const { generateIconsSource } = require('svgtofont/src/generate');	
const path = require('path');	

async function generate () {	
  const outPath = await generateIconsSource({	
    src: path.resolve(process.cwd(), 'svg'),	
    dist: path.resolve(process.cwd(), 'dist'),	
    fontName: 'svgtofont',	
  });	
}	

generate();
```

### src

> Type: `String`  
> Default value: `svg`  

output path

### emptyDist

> Type: `String`  
> Default value: `false`  

Clear output directory contents

### fontName

> Type: `String`  
> Default value: `iconfont`  

The font family name you want.

### startUnicode

> Type: `Number`  
> Default value: `0xea01`  

unicode start number

### classNamePrefix

> Type: `String`  
> Default value: font name  

Create font class name prefix, default value font name.

### css

> Type: `Boolean|CSSOptions`  
> Default value: `false`  

Create CSS/LESS files, default `true`.

```ts
type CSSOptions = {
  /**
   * Output the css file to the specified directory
   */
  output?: string;
  /**
   * Which files are exported.
   */
  include?: RegExp;
  /**
   * Setting font size.
   */
  fontSize?: string;
}
```

### svgicons2svgfont

This is the setting for [svgicons2svgfont](https://github.com/nfroidure/svgicons2svgfont/tree/dd713bea4f97afa59f7dba6a21ff7f22db565bcf#api)


#### svgicons2svgfont.fontName

> Type: `String`  
> Default value: `'iconfont'`  

The font family name you want.

#### svgicons2svgfont.fontId

> Type: `String`  
> Default value: the options.fontName value  

The font id you want.

#### svgicons2svgfont.fontStyle

> Type: `String`  
> Default value: `''`

The font style you want.

#### svgicons2svgfont.fontWeight

> Type: `String`  
> Default value: `''`

The font weight you want.

#### svgicons2svgfont.fixedWidth

> Type: `Boolean`  
> Default value: `false`  

Creates a monospace font of the width of the largest input icon.

#### svgicons2svgfont.centerHorizontally

> Type: `Boolean`  
> Default value: `false`  

Calculate the bounds of a glyph and center it horizontally.

#### svgicons2svgfont.normalize

> Type: `Boolean`  
> Default value: `false`  

Normalize icons by scaling them to the height of the highest icon.

#### svgicons2svgfont.fontHeight

> Type: `Number`  
> Default value: `MAX(icons.height)`  

The outputted font height  (defaults to the height of the highest input icon).

#### svgicons2svgfont.round

> Type: `Number`  
> Default value: `10e12`  

Setup SVG path rounding.

#### svgicons2svgfont.descent

> Type: `Number`  
> Default value: `0`  

The font descent. It is useful to fix the font baseline yourself.

**Warning:**  The descent is a positive value!

#### svgicons2svgfont.ascent

> Type: `Number`  
> Default value: `fontHeight - descent`  

The font ascent. Use this options only if you know what you're doing. A suitable
 value for this is computed for you.

#### svgicons2svgfont.metadata

> Type: `String`  
> Default value: `undefined`  

The font [metadata](http://www.w3.org/TR/SVG/metadata.html). You can set any
 character data in but it is the be suited place for a copyright mention.

#### svgicons2svgfont.log

> Type: `Function`  
> Default value: `console.log`  

Allows you to provide your own logging function. Set to `function(){}` to
 disable logging.

### svg2ttf

This is the setting for [svg2ttf](https://github.com/fontello/svg2ttf/tree/c33a126920f46b030e8ce960cc7a0e38a6946bbc#svg2ttfsvgfontstring-options---buf)

#### svg2ttf.copyright

> Type: `String`

copyright string

#### svg2ttf.ts

> Type: `String`

Unix timestamp (in seconds) to override creation time 

#### svg2ttf.version

> Type: `Number`

font version string, can be Version `x.y` or `x.y`.

### website

Define preview web content. Example: 

```js
{
  ...
  // website = null, no demo html files
  website: {
    title: "svgtofont",
    logo: path.resolve(process.cwd(), "svg", "git.svg"),
    version: pkg.version,
    meta: {
      description: "Converts SVG fonts to TTF/EOT/WOFF/WOFF2/SVG format.",
      keywords: "svgtofont,TTF,EOT,WOFF,WOFF2,SVG",
      favicon: "./favicon.png"
    },
    // Add a Github corner to your website
    // Like: https://github.com/uiwjs/react-github-corners
    corners: {
      url: 'https://github.com/jaywcjlove/svgtofont',
      width: 62, // default: 60
      height: 62, // default: 60
      bgColor: '#dc3545' // default: '#151513'
    },
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
        url: "index.html"
      },
      {
        title: "Unicode",
        url: "unicode.html"
      }
    ]
  }
}
```

#### website.template

> Type: `String`  
> Default value: [index.ejs](src/website/index.ejs)  

Custom template can customize parameters. You can define your own template based on the [default template](src/website/index.ejs).

```js
{
  website: {
    template: path.join(process.cwd(), "my-template.ejs")
  }
}
```
#### website.index

> Type: `String`  
> Default value: `font-class`, Enum{`font-class`, `unicode`, `symbol`}  

Set default home page.

## Font Usage

Suppose the font name is defined as `svgtofont`, The default home page is `unicode`, Will generate: 

```bash
font-class.html
index.html
svgtofont.css
svgtofont.eot
svgtofont.json
svgtofont.less
svgtofont.module.less
svgtofont.scss
svgtofont.styl
svgtofont.svg
svgtofont.symbol.svg
svgtofont.ttf
svgtofont.woff
svgtofont.woff2
symbol.html
```

Preview demo `font-class.html`, `symbol.html` and `index.html`. Automatically generated style `svgtofont.css` and `svgtofont.less`.

### symbol svg

```xml
<svg class="icon" aria-hidden="true">
  <use xlink:href="svgtofont.symbol.svg#svgtofont-git"></use>
</svg>
```

### Unicode

```html
<style>
.iconfont {
  font-family: "svgtofont-iconfont" !important;
  font-size: 16px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -webkit-text-stroke-width: 0.2px;
  -moz-osx-font-smoothing: grayscale;
}
</style>
<span class="iconfont">&#59907;</span>
```

### Class Name

Support for `.less` and `.css` styles references.

```html
<link rel="stylesheet" type="text/css" href="node_modules/fonts/svgtofont.css">
<i class="svgtofont-apple"></i>
```

## License

Licensed under the [MIT License](https://opensource.org/licenses/MIT).
