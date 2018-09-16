svg to font
---

Read a set of SVG icons and ouput a TTF/EOT/WOFF/WOFF2/SVG font.

[Install](#install) | [Usage](#usage) | [API](#api) | [options](#options) | [npm](http://npm.im/svgtofont) | [License](#license)

**Icon Font Created By svgtofont**

- [file-icons](https://uiw-react.github.io/file-icons/) File icons in the file tree.

## Install

```bash
npm i svgtofont
```

## Usage

```js
const svgtofont = require("svgtofont");
const path = require("path");

svgtofont({
  src: path.resolve(process.cwd(), "icon"), // svg path
  dist: path.resolve(process.cwd(), "fonts"), // output path
  fontName: "svgtofont", // font name
  css: true, // Create CSS files.
  startNumber: 20000, // unicode start number
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
const { createSVG, createTTF, createEOT, createWOFF, createWOFF2 } = require("svgtofont/src/utils");
const options = { ... };

createSVG(options)
  .then(UnicodeObjChar => {
    return createTTF(options);
  })
  .then(() => {
    return createEOT(options);
  })
  .then(() => {
    return createWOFF(options);
  })
  .then(() => {
    return createWOFF2(options);
  })
```

## options

> svgtofont(options)

### dist

> Type: `String`  
> Default value: `dist`  

svg path

### src

> Type: `String`  
> Default value: `svg`  

output path

### fontName

> Type: `String`  
> Default value: `iconfont`  

The font family name you want.

### unicodeStart

> Type: `Number`  
> Default value: `10000`  

unicode start number

### clssaNamePrefix

> Type: `String`  
> Default value: font name  

Create font class name prefix, default value font name.

### css

> Type: `Boolean`  
> Default value: `false`  

Create CSS/LESS files, default `true`.

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

The font descent. It is usefull to fix the font baseline yourself.

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
    footerLinks: [
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

> Custom template can customize parameters.

You can define your own template based on the [default template](src/website/index.ejs).

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

## License

Licensed under the [MIT License](https://opensource.org/licenses/MIT).