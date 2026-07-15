// Shared plumbing for the 20 background-design SVG generators in registry.ts. Every
// exported helper here either does pure geometry/number math or passes a theme color
// straight through as a string — none of them ever introduce a color of their own, so the
// registry stays free of hardcoded hex (verified by grep as part of QA — see
// docs/background-designs/HANDOFF.md).

import type { Theme } from '@/components/internal-tools/themes/themeTypes';

let counter = 0;

/**
 * A fresh id for one render call's <defs> entries. Needed because several design
 * instances can render into the same DOM at once (e.g. every cover-style page in a
 * document's off-screen PDF export host) — without unique ids, `url(#foo)` references
 * across sibling <svg>s could collide.
 */
export function uid(prefix: string): string {
  counter += 1;
  return `bfbg-${prefix}-${counter}`;
}

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

/** Lightens a hex color toward white by `amount` (0-1) — the same fallback-gradient math
 * themeToCss.ts uses, kept as a local copy so this lib has no dependency on the themes
 * module's private internals. */
export function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const up = (c: number) => Math.round(c + (255 - c) * amount);
  const to2 = (c: number) => c.toString(16).padStart(2, '0');
  return `#${to2(up(r))}${to2(up(g))}${to2(up(b))}`;
}

/** The theme's own 3-stop signature gradient, or the same accent-derived fallback the rest
 * of the theme system falls back to when a theme doesn't define one. */
export function gradientStops(theme: Theme): [string, string, string] {
  return theme.colors.gradient ?? [theme.colors.accent, lighten(theme.colors.accent, 0.18), lighten(theme.colors.accent, 0.34)];
}

/** Wraps generated markup in a complete, responsively-scaling SVG document. width/height
 * define the coordinate space every design's math is written against; the element itself
 * fills whatever box it's placed in (BackgroundLayer sizes that box to match). */
export function svgRoot(width: number, height: number, inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice">${inner}</svg>`;
}

/** A soft circular glow: a radial gradient from `color` at `peakOpacity` fading to fully
 * transparent — the building block behind every "orb"/"glow"/"bleed" design. */
export function glowCircle(cx: number, cy: number, r: number, color: string, peakOpacity: number): string {
  const id = uid('glow');
  return `<defs><radialGradient id="${id}" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="${color}" stop-opacity="${peakOpacity}"/>
    <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
  </radialGradient></defs>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})"/>`;
}
