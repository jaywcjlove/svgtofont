import { load, type CheerioAPI, type Cheerio } from 'cheerio';
import type { AnyNode } from 'domhandler';

// --- Types ---

export interface ColorGroup {
  color: string;
  elements: string[];
}

export interface SvgAnalysis {
  isMulticolor: boolean;
  colorGroups: ColorGroup[];
  viewBox: string;
  width: string;
  height: string;
}

export interface LayerSvg {
  layerIndex: number;
  color: string;
  svgContent: string;
}

export interface MulticolorLayerInfo {
  layerIndex: number;
  glyphName: string;
  unicode: string;
  color: string;
  encodedCode: number;
}

export interface MulticolorIconInfo {
  originalName: string;
  layerCount: number;
  layers: MulticolorLayerInfo[];
}

export type MulticolorMap = Record<string, MulticolorIconInfo>;

export interface CreateSVGResult {
  unicodeObject: Record<string, string>;
  multicolorMap: MulticolorMap;
}

// --- Named CSS colors map (subset of most common) ---

const CSS_COLORS: Record<string, string> = {
  black: '#000000', white: '#ffffff', red: '#ff0000', green: '#008000', blue: '#0000ff',
  yellow: '#ffff00', cyan: '#00ffff', magenta: '#ff00ff', orange: '#ffa500', purple: '#800080',
  pink: '#ffc0cb', gray: '#808080', grey: '#808080', silver: '#c0c0c0', maroon: '#800000',
  olive: '#808000', lime: '#00ff00', aqua: '#00ffff', teal: '#008080', navy: '#000080',
  fuchsia: '#ff00ff', brown: '#a52a2a', coral: '#ff7f50', crimson: '#dc143c', gold: '#ffd700',
  indigo: '#4b0082', ivory: '#fffff0', khaki: '#f0e68c', lavender: '#e6e6fa', linen: '#faf0e6',
  orchid: '#da70d6', peru: '#cd853f', plum: '#dda0dd', salmon: '#fa8072', sienna: '#a0522d',
  tan: '#d2b48c', thistle: '#d8bfd8', tomato: '#ff6347', turquoise: '#40e0d0', violet: '#ee82ee',
  wheat: '#f5deb3', darkblue: '#00008b', darkgreen: '#006400', darkred: '#8b0000',
  darkgray: '#a9a9a9', darkgrey: '#a9a9a9', lightblue: '#add8e6', lightgreen: '#90ee90',
  lightgray: '#d3d3d3', lightgrey: '#d3d3d3', lightpink: '#ffb6c1', lightyellow: '#ffffe0',
};

// --- Color normalization ---

export function normalizeColor(color: string): string {
  if (!color) return '#000000';

  const trimmed = color.trim().toLowerCase();

  if (trimmed === 'none' || trimmed === 'transparent') return 'none';
  if (trimmed === 'currentcolor') return 'currentColor';

  // Already hex
  if (trimmed.startsWith('#')) {
    if (trimmed.length === 4) {
      // #abc -> #aabbcc
      return '#' + trimmed[1] + trimmed[1] + trimmed[2] + trimmed[2] + trimmed[3] + trimmed[3];
    }
    return trimmed;
  }

  // rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  // Named CSS color
  if (CSS_COLORS[trimmed]) {
    return CSS_COLORS[trimmed];
  }

  // Fallback: return as-is (e.g. url(#gradient))
  return trimmed;
}

// --- Resolve effective fill ---

export function resolveEffectiveFill($: CheerioAPI, $el: Cheerio<AnyNode>): string {
  // Check the element itself first
  const fill = $el.attr('fill');
  if (fill !== undefined && fill !== null) {
    return fill;
  }

  // Walk up parent <g> elements
  let $parent = $el.parent();
  while ($parent.length > 0) {
    const tagName = ($parent[0] as any)?.tagName || ($parent[0] as any)?.name;
    if (tagName === 'svg') break;

    const parentFill = $parent.attr('fill');
    if (parentFill !== undefined && parentFill !== null) {
      return parentFill;
    }
    $parent = $parent.parent();
  }

  // SVG default fill is black
  return '#000000';
}

// --- Analyze SVG colors ---

export function analyzeSvgColors(svgContent: string): SvgAnalysis {
  const $ = load(svgContent, { xmlMode: true });
  const svg = $('svg');
  const viewBox = svg.attr('viewBox') || '0 0 24 24';
  const width = svg.attr('width') || '24';
  const height = svg.attr('height') || '24';

  const shapeSelectors = 'path, rect, circle, ellipse, polygon, polyline, line';
  const colorMap = new Map<string, string[]>();

  $(shapeSelectors).each((_, el) => {
    const $el = $(el);
    const fill = resolveEffectiveFill($, $el);
    const normalized = normalizeColor(fill);

    // Skip invisible elements
    if (normalized === 'none') return;

    // Skip gradient/pattern fills (url references)
    if (normalized.startsWith('url(')) return;

    if (!colorMap.has(normalized)) {
      colorMap.set(normalized, []);
    }

    // Serialize this element, preserving transforms from parent <g> groups
    const elHtml = serializeElementWithTransforms($, $el);
    colorMap.get(normalized)!.push(elHtml);
  });

  const colorGroups: ColorGroup[] = Array.from(colorMap.entries()).map(([color, elements]) => ({
    color,
    elements,
  }));

  return {
    isMulticolor: colorGroups.length >= 2,
    colorGroups,
    viewBox,
    width,
    height,
  };
}

// --- Serialize element with ancestor transforms ---

function serializeElementWithTransforms($: CheerioAPI, $el: Cheerio<AnyNode>): string {
  const transforms: string[] = [];

  // Collect transforms from ancestor <g> elements
  let $parent = $el.parent();
  while ($parent.length > 0) {
    const tagName = ($parent[0] as any)?.tagName || ($parent[0] as any)?.name;
    if (tagName === 'svg') break;

    const transform = $parent.attr('transform');
    if (transform) {
      transforms.unshift(transform);
    }
    $parent = $parent.parent();
  }

  // Get the element HTML, strip fill attribute
  let elHtml = $.html($el) || '';
  elHtml = elHtml.replace(/\s*fill="[^"]*"/g, '');

  // If there are ancestor transforms, wrap in <g> elements
  if (transforms.length > 0) {
    let wrapped = elHtml;
    for (let i = transforms.length - 1; i >= 0; i--) {
      wrapped = `<g transform="${transforms[i]}">${wrapped}</g>`;
    }
    return wrapped;
  }

  return elHtml;
}

// --- Generate layer SVGs ---

export function generateLayerSvgs(analysis: SvgAnalysis): LayerSvg[] {
  return analysis.colorGroups.map((group, index) => {
    const svgContent = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${analysis.viewBox}" width="${analysis.width}" height="${analysis.height}">`,
      ...group.elements,
      '</svg>',
    ].join('\n');

    return {
      layerIndex: index,
      color: group.color,
      svgContent,
    };
  });
}
