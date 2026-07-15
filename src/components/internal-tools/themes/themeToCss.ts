import type { CSSProperties } from 'react';
import type { Theme } from './themeTypes';

// Pure Theme → CSS-custom-property mapping. This is the entire theming mechanism: the
// returned object goes on ThemedDocument's wrapper div as an inline style, the vars
// cascade, and every existing document .module.css rule picks them up unmodified.
//
// The alpha tiers mirror tokens.css exactly (muted .72, soft .6, line .08,
// line-strong .16, glass .04) so Classic — whose muted equals the paper foreground
// #0b0f1f — reproduces today's computed values precisely.

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Perceived-lightness shift used to derive a second gradient stop from the accent. */
function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const up = (c: number) => Math.round(c + (255 - c) * amount);
  const to2 = (c: number) => c.toString(16).padStart(2, '0');
  return `#${to2(up(r))}${to2(up(g))}${to2(up(b))}`;
}

/**
 * True when a hex color reads as "dark" (WCAG relative luminance below 0.35) — used to
 * pick logo and cover treatments that stay legible on dark paper.
 */
export function isDarkColor(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.35;
}

/**
 * The document components read exactly these custom properties (inventory in
 * docs/phase3/DISCOVERY.md). Pinning all of them here also insulates document previews
 * and PDF exports from anything that changes variables on the surrounding chrome.
 */
export function themeToCss(theme: Theme): CSSProperties {
  const { background, foreground, accent, muted, gradient } = theme.colors;
  const [from, via, to] = gradient ?? [accent, lighten(accent, 0.18), lighten(accent, 0.34)];
  const vars: Record<string, string> = {
    '--bf-paper-bg': background,
    '--bf-paper-fg': foreground,
    '--bf-paper-fg-muted': rgba(muted, 0.72),
    '--bf-paper-fg-soft': rgba(muted, 0.6),
    '--bf-paper-line': rgba(muted, 0.08),
    '--bf-paper-line-strong': rgba(muted, 0.16),
    '--bf-paper-glass': rgba(muted, 0.04),
    '--bf-color-accent': accent,
    '--bf-grad-primary': `linear-gradient(105deg, ${from} 0%, ${via} 50%, ${to} 100%)`,
    '--bf-grad-callout': `linear-gradient(180deg, ${from}, ${to})`,
    '--bf-font-display': theme.fonts.display,
    '--bf-font-body': theme.fonts.body,
    // A CSS custom property (not the data-bf-on-dark attribute selector this used to be
    // driven by) so a nested per-page/per-slide theme override correctly recascades: the
    // nearest ancestor's value always wins for a descendant, the same as every other
    // themed property here, whereas an attribute-selector rule matches ANY ancestor with
    // the attribute set — including one further out than a lighter override underneath it.
    '--bf-logo-filter': isDarkColor(background) ? 'brightness(0) invert(1)' : 'none',
  };
  return vars as CSSProperties;
}
