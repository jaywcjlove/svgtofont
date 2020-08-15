/// <reference types="node" />

/**
 * ttf2eot, Font convertor, TTF to EOT, for node.js  
 * GitHub: https://github.com/fontello/ttf2eot
 */
declare module 'ttf2eot' {
  export default function(ttf: Buffer): Buffer;
}
declare module 'ttf2woff' {
  export default function(ttf: Buffer): Buffer;
}
declare module 'copy-template-dir' {
  export default function(templateDir: string, targetDir: string, options: Record<string, any>, callback: (err: Error, createdFiles: string[]) => void): void;
}

/**
 * svgicons2svgfont  
 * Concatenate SVG icons and ouput an SVG font.  
 * Github: https://github.com/nfroidure/svgicons2svgfont
 */
declare module 'svgicons2svgfont' {
  import fs from 'fs';
  import * as stream from 'stream';
  /**
   * API `new SVGIcons2SVGFontStream(options)`
   * https://github.com/nfroidure/svgicons2svgfont/tree/dd525339281bb089d26b50b713a8f69a7a93d825#api
   */
  export type SVGIcons2SVGFontOptions = {
    /**
     * The font family name you want.
     * @default iconfont
     */
    fontName?: string;
    /**
     * The font id you want.
     * Default value: the `options.fontName` value
     */
    fontId?: string;
    /**
     * The font style you want.
     */
    fontStyle?: string;
    /**
     * The font weight you want. Default value: ''
     */
    fontWeight?: string;
    /**
     * Creates a monospace font of the width of the largest input icon.
     * @default false
     */
    fixedWidth?: boolean;
    /**
     * Calculate the bounds of a glyph and center it horizontally.
     * @default false
     */
    centerHorizontally?: boolean;
    /**
     * Normalize icons by scaling them to the height of the highest icon.
     * @default false
     */
    normalize?: boolean;
    /**
     * The outputted font height (defaults to the height of the highest input icon).
     * @default MAX(icons.height)
     */
    fontHeight?: number;
    /**
     * Setup SVG path rounding.
     * @default 10e12
     */
    round?: number;
    /**
     * The font descent. It is usefull to fix the font baseline yourself.
     * @default 0
     * Warning: The descent is a positive value!
     */
    descent?: number;
    /**
     * The font ascent. Use this options only if you know what you're doing. A suitable value for this is computed for you.
     * @default fontHeight - descent
     */
    ascent?: number;
    /**
     * The font metadata. You can set any character data in but it is the be suited place for a copyright mention.
     * @default undefined
     * @see http://www.w3.org/TR/SVG/metadata.html
     */
    metadata?: number;
    /**
     * Allows you to provide your own logging function. Set to function(){} to disable logging.
     * @default console.log
     */
    log?: () => void;
    /**
     * A function which determines the metadata for an icon. It takes a parameter file with an icon svg and should return icon metadata (asynchronously) via the callback function.  
     * You can use this function to provide custom logic for svg to codepoint mapping.
     * @default require('svgicons2svgfont/src/metadata')(options)
     */
    metadataProvider?: (
      file: string,
      cb: (err: any, metadata: {file: string, name: string, unicode: string[], renamed: boolean}) => void) => void;
  }
  export interface Glyphs extends fs.ReadStream {
    metadata: { name: string, unicode: string[] }
  }
  function ListentEvent(): void;
  export default class SVGIcons2SVGFont {
    constructor(options: SVGIcons2SVGFontOptions);
    write(glyphs: Glyphs): void;
    pipe(glyphs: fs.WriteStream): SVGIcons2SVGFont;
    /**
     * Do not forget to end the stream
     */
    end(): void;
    on(event: "close", listener: () => void): this;
    on(event: "drain", listener: () => void): this;
    on(event: "error", listener: (err: Error) => void): this;
    on(event: "finish", listener: () => void): this;
    on(event: "open", listener: (fd: number) => void): this;
    on(event: "pipe", listener: (src: stream.Readable) => void): this;
    on(event: "ready", listener: () => void): this;
    on(event: "unpipe", listener: (src: stream.Readable) => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
  }
}
