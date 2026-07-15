// The 20 built-in background designs, in registry order (display order for the picker —
// not a category; the picker shows one flat, scannable list, same convention as the
// Presentations slide-template picker). Every design is a pure function of (theme, width,
// height); every color comes from theme.colors via the interpolations below — grep this
// file for `#[0-9a-fA-F]{6}` as a final QA check and expect zero literal matches (runtime
// values interpolated from theme.colors don't count — they're not string literals here).

import type { Theme } from '@/components/internal-tools/themes/themeTypes';
import type { BackgroundDesign } from './types';
import { glowCircle, gradientStops, svgRoot, uid } from './svgHelpers';

// ---- 1 & 2. Corner Orbs (mirrored pair) --------------------------------------------------

function cornerOrbs(theme: Theme, w: number, h: number, cxFrac: number, cyFrac: number): string {
  const [stop0, stop1] = gradientStops(theme);
  const big = glowCircle(w * cxFrac, h * cyFrac, Math.max(w, h) * 0.42, theme.colors.accent, 0.16);
  const small = glowCircle(
    w * (cxFrac > 0.5 ? cxFrac - 0.14 : cxFrac + 0.14),
    h * (cyFrac > 0.5 ? cyFrac - 0.1 : cyFrac + 0.1),
    Math.max(w, h) * 0.24,
    stop1 ?? stop0,
    0.12,
  );
  return svgRoot(w, h, big + small);
}

// ---- 3. Single Corner Bleed --------------------------------------------------------------

function singleCornerBleed(theme: Theme, w: number, h: number): string {
  return svgRoot(w, h, glowCircle(w, 0, Math.max(w, h) * 0.62, theme.colors.accent, 0.16));
}

// ---- 4. Radial Center Glow -----------------------------------------------------------------

function radialCenterGlow(theme: Theme, w: number, h: number): string {
  return svgRoot(w, h, glowCircle(w / 2, h / 2, Math.max(w, h) * 0.55, theme.colors.accent, 0.07));
}

// ---- 5. Diagonal Grid ----------------------------------------------------------------------

function diagonalGrid(theme: Theme, w: number, h: number): string {
  const id = uid('pattern');
  const size = Math.max(w, h) * 0.035;
  return svgRoot(
    w,
    h,
    `<defs><pattern id="${id}" width="${size}" height="${size}" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="${size}" stroke="${theme.colors.muted}" stroke-opacity="0.06" stroke-width="1"/>
    </pattern></defs>
    <rect width="${w}" height="${h}" fill="url(#${id})"/>`,
  );
}

// ---- 6. Dot Matrix --------------------------------------------------------------------------

function dotMatrix(theme: Theme, w: number, h: number): string {
  const id = uid('pattern');
  const size = Math.max(w, h) * 0.034;
  return svgRoot(
    w,
    h,
    `<defs><pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.07}" fill="${theme.colors.muted}" fill-opacity="0.10"/>
    </pattern></defs>
    <rect width="${w}" height="${h}" fill="url(#${id})"/>`,
  );
}

// ---- 7. Concentric Rings --------------------------------------------------------------------

function concentricRings(theme: Theme, w: number, h: number): string {
  const colors = gradientStops(theme);
  const cx = w;
  const cy = 0;
  const fracs = [0.16, 0.27, 0.38, 0.49, 0.6];
  const rings = fracs
    .map((f, i) => {
      const r = Math.max(w, h) * f;
      const color = colors[i % colors.length];
      const opacity = Math.max(0.03, 0.15 - i * 0.022);
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="${Math.max(1, w * 0.0025)}"/>`;
    })
    .join('');
  return svgRoot(w, h, rings);
}

// ---- 8. Blueprint Grid ----------------------------------------------------------------------

function blueprintGrid(theme: Theme, w: number, h: number): string {
  const id = uid('pattern');
  const cell = Math.max(w, h) * 0.048;
  return svgRoot(
    w,
    h,
    `<defs><pattern id="${id}" width="${cell}" height="${cell}" patternUnits="userSpaceOnUse">
      <path d="M ${cell} 0 L 0 0 0 ${cell}" fill="none" stroke="${theme.colors.muted}" stroke-opacity="0.07" stroke-width="1"/>
    </pattern></defs>
    <rect width="${w}" height="${h}" fill="url(#${id})"/>`,
  );
}

// ---- 9. Diagonal Accent Band ------------------------------------------------------------------

function diagonalAccentBand(theme: Theme, w: number, h: number): string {
  const id = uid('band');
  const bandW = Math.max(w, h) * 0.6;
  return svgRoot(
    w,
    h,
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${theme.colors.accent}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${theme.colors.accent}" stop-opacity="0.13"/>
      <stop offset="100%" stop-color="${theme.colors.accent}" stop-opacity="0"/>
    </linearGradient></defs>
    <rect x="${-bandW * 0.2}" y="${-bandW * 0.5}" width="${bandW}" height="${bandW * 1.3}" fill="url(#${id})"
      transform="translate(${w * 0.82} ${h * 0.1}) rotate(35)"/>`,
  );
}

// ---- 10. Gradient Mesh Wash -------------------------------------------------------------------

function gradientMeshWash(theme: Theme, w: number, h: number): string {
  const [c1, c2, c3] = gradientStops(theme);
  const blobs = [
    { cx: w * 0.86, cy: h * 0.22, r: Math.max(w, h) * 0.34, color: c1, op: 0.1 },
    { cx: w * 0.97, cy: h * 0.58, r: Math.max(w, h) * 0.3, color: c2, op: 0.08 },
    { cx: w * 0.82, cy: h * 0.88, r: Math.max(w, h) * 0.26, color: c3, op: 0.07 },
  ];
  return svgRoot(w, h, blobs.map((b) => glowCircle(b.cx, b.cy, b.r, b.color, b.op)).join(''));
}

// ---- 11. Scattered Dots ---------------------------------------------------------------------

/** Fixed scatter — deterministic per the spec (same design+theme renders identically every
 * time), biased into the top-right quadrant, well clear of the center-left text zone. */
const SCATTER_POINTS: Array<[number, number, number]> = [
  [0.6, 0.08, 0.006],
  [0.68, 0.05, 0.004],
  [0.76, 0.12, 0.007],
  [0.84, 0.06, 0.005],
  [0.91, 0.15, 0.006],
  [0.64, 0.18, 0.004],
  [0.72, 0.22, 0.005],
  [0.8, 0.2, 0.004],
  [0.89, 0.28, 0.006],
  [0.57, 0.24, 0.004],
  [0.95, 0.08, 0.005],
  [0.66, 0.3, 0.004],
];

function scatteredDots(theme: Theme, w: number, h: number): string {
  const unit = Math.max(w, h);
  const dots = SCATTER_POINTS.map(
    ([fx, fy, fr]) => `<circle cx="${w * fx}" cy="${h * fy}" r="${unit * fr}" fill="${theme.colors.accent}" fill-opacity="0.16"/>`,
  ).join('');
  return svgRoot(w, h, dots);
}

// ---- 12 & 13. Edge Glow (Left / Right) ---------------------------------------------------------

function edgeGlow(theme: Theme, w: number, h: number, side: 'left' | 'right'): string {
  const id = uid('edge');
  const x1 = side === 'left' ? '0%' : '100%';
  const x2 = side === 'left' ? '100%' : '0%';
  return svgRoot(
    w,
    h,
    `<defs><linearGradient id="${id}" x1="${x1}" y1="0" x2="${x2}" y2="0">
      <stop offset="0%" stop-color="${theme.colors.accent}" stop-opacity="0.13"/>
      <stop offset="42%" stop-color="${theme.colors.accent}" stop-opacity="0"/>
    </linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#${id})"/>`,
  );
}

// ---- 14. Circuit Lines ----------------------------------------------------------------------

/** Fixed node layout + edge list — a small abstract circuit confined to the top-right
 * quadrant, deterministic like Scattered Dots. */
const CIRCUIT_NODES: Array<[number, number]> = [
  [0.6, 0.1],
  [0.72, 0.1],
  [0.72, 0.22],
  [0.86, 0.22],
  [0.86, 0.08],
  [0.66, 0.3],
  [0.9, 0.34],
  [0.8, 0.4],
];
const CIRCUIT_EDGES: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [2, 5],
  [5, 6],
  [5, 7],
];

function circuitLines(theme: Theme, w: number, h: number): string {
  const pts = CIRCUIT_NODES.map(([fx, fy]) => [w * fx, h * fy] as const);
  const lines = CIRCUIT_EDGES.map(
    ([a, b]) =>
      `<line x1="${pts[a][0]}" y1="${pts[a][1]}" x2="${pts[b][0]}" y2="${pts[b][1]}" stroke="${theme.colors.muted}" stroke-opacity="0.11" stroke-width="${Math.max(1, w * 0.0018)}"/>`,
  ).join('');
  const nodes = pts
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${w * 0.006}" fill="${theme.colors.accent}" fill-opacity="0.18"/>`)
    .join('');
  return svgRoot(w, h, lines + nodes);
}

// ---- 15. Wave Sweep -------------------------------------------------------------------------

function waveSweep(theme: Theme, w: number, h: number): string {
  const y = h * 0.74;
  const path = `M 0 ${y} C ${w * 0.25} ${y - h * 0.06}, ${w * 0.5} ${y + h * 0.05}, ${w * 0.75} ${y - h * 0.03} S ${w} ${y + h * 0.02}, ${w} ${y}`;
  return svgRoot(
    w,
    h,
    `<path d="${path}" fill="none" stroke="${theme.colors.accent}" stroke-opacity="0.13" stroke-width="${Math.max(2, h * 0.006)}" stroke-linecap="round"/>`,
  );
}

// ---- 16. Split Diagonal ---------------------------------------------------------------------

function splitDiagonal(theme: Theme, w: number, h: number): string {
  // A single low-opacity accent-tinted triangle over the bottom-left half; the untouched
  // remainder reads as plain `background` — the barely-perceptible "two tone bands" effect
  // without ever painting a literal (redundant) copy of the background color.
  const points = `0,${h} ${w * 0.58},0 0,0`;
  return svgRoot(w, h, `<polygon points="${points}" fill="${theme.colors.accent}" fill-opacity="0.045"/>`);
}

// ---- 17. Halo Ring --------------------------------------------------------------------------

function haloRing(theme: Theme, w: number, h: number): string {
  const cx = w * 1.04;
  const cy = -h * 0.06;
  const r = Math.max(w, h) * 0.56;
  return svgRoot(
    w,
    h,
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${theme.colors.accent}" stroke-opacity="0.1" stroke-width="${Math.max(2, w * 0.004)}"/>`,
  );
}

// ---- 18. Pixel Grid -------------------------------------------------------------------------

function pixelGrid(theme: Theme, w: number, h: number): string {
  const id = uid('pattern');
  const cell = Math.max(w, h) * 0.03;
  const sq = cell * 0.42;
  return svgRoot(
    w,
    h,
    `<defs><pattern id="${id}" width="${cell}" height="${cell}" patternUnits="userSpaceOnUse">
      <rect x="${(cell - sq) / 2}" y="${(cell - sq) / 2}" width="${sq}" height="${sq}" fill="${theme.colors.muted}" fill-opacity="0.08"/>
    </pattern></defs>
    <rect width="${w}" height="${h}" fill="url(#${id})"/>`,
  );
}

// ---- 19. Binary Fade ------------------------------------------------------------------------

/** Fixed glyph rows — deterministic, not regenerated per render. Per-row opacity is
 * computed from distance-to-vertical-center (pure number math, no mask/extra color needed)
 * so rows fade toward the page's middle exactly as the spec asks. */
const BINARY_ROWS = [
  '01001 10110 00101 11010 01100 10011 01110',
  '11010 00110 10101 01001 11000 00111 10010',
  '00101 11001 01010 10110 00011 11100 01001',
  '10011 01101 00110 11101 00010 10011 11010',
];

function binaryFade(theme: Theme, w: number, h: number): string {
  const rowCount = 9;
  const fontSize = Math.max(w, h) * 0.02;
  const rows = Array.from({ length: rowCount }, (_, i) => {
    const y = h * 0.05 + i * ((h * 0.9) / (rowCount - 1));
    const distFromCenter = Math.abs(i - (rowCount - 1) / 2) / ((rowCount - 1) / 2);
    const opacity = (0.02 + distFromCenter * 0.09).toFixed(3);
    const text = BINARY_ROWS[i % BINARY_ROWS.length];
    return `<text x="${w * 0.04}" y="${y}" font-family="monospace" font-size="${fontSize}" fill="${theme.colors.muted}" fill-opacity="${opacity}" letter-spacing="${(fontSize * 0.3).toFixed(1)}">${text}</text>`;
  }).join('');
  return svgRoot(w, h, rows);
}

// ---- 20. Minimal Corner Mark ------------------------------------------------------------------

function minimalCornerMark(theme: Theme, w: number, h: number): string {
  const r = Math.max(w, h) * 0.012;
  return svgRoot(w, h, `<circle cx="${w * 0.94}" cy="${h * 0.08}" r="${r}" fill="${theme.colors.accent}" fill-opacity="0.55"/>`);
}

// ---- registry --------------------------------------------------------------------------------

export const BACKGROUND_DESIGNS: readonly BackgroundDesign[] = [
  { id: 'corner-orbs-top-right', name: 'Corner Orbs (Top Right)', renderSvg: (t, w, h) => cornerOrbs(t, w, h, 0.94, 0.06) },
  { id: 'corner-orbs-bottom-left', name: 'Corner Orbs (Bottom Left)', renderSvg: (t, w, h) => cornerOrbs(t, w, h, 0.06, 0.94) },
  { id: 'single-corner-bleed', name: 'Single Corner Bleed', renderSvg: singleCornerBleed },
  { id: 'radial-center-glow', name: 'Radial Center Glow', renderSvg: radialCenterGlow },
  { id: 'diagonal-grid', name: 'Diagonal Grid', renderSvg: diagonalGrid },
  { id: 'dot-matrix', name: 'Dot Matrix', renderSvg: dotMatrix },
  { id: 'concentric-rings', name: 'Concentric Rings', renderSvg: concentricRings },
  { id: 'blueprint-grid', name: 'Blueprint Grid', renderSvg: blueprintGrid },
  { id: 'diagonal-accent-band', name: 'Diagonal Accent Band', renderSvg: diagonalAccentBand },
  { id: 'gradient-mesh-wash', name: 'Gradient Mesh Wash', renderSvg: gradientMeshWash },
  { id: 'scattered-dots', name: 'Scattered Dots', renderSvg: scatteredDots },
  { id: 'edge-glow-left', name: 'Edge Glow (Left)', renderSvg: (t, w, h) => edgeGlow(t, w, h, 'left') },
  { id: 'edge-glow-right', name: 'Edge Glow (Right)', renderSvg: (t, w, h) => edgeGlow(t, w, h, 'right') },
  { id: 'circuit-lines', name: 'Circuit Lines', renderSvg: circuitLines },
  { id: 'wave-sweep', name: 'Wave Sweep', renderSvg: waveSweep },
  { id: 'split-diagonal', name: 'Split Diagonal', renderSvg: splitDiagonal },
  { id: 'halo-ring', name: 'Halo Ring', renderSvg: haloRing },
  { id: 'pixel-grid', name: 'Pixel Grid', renderSvg: pixelGrid },
  { id: 'binary-fade', name: 'Binary Fade', renderSvg: binaryFade },
  { id: 'minimal-corner-mark', name: 'Minimal Corner Mark', renderSvg: minimalCornerMark },
];

export const BACKGROUND_DESIGN_MAP: ReadonlyMap<string, BackgroundDesign> = new Map(
  BACKGROUND_DESIGNS.map((d) => [d.id, d]),
);

export function getBackgroundDesign(id: string | undefined): BackgroundDesign | undefined {
  return id ? BACKGROUND_DESIGN_MAP.get(id) : undefined;
}
