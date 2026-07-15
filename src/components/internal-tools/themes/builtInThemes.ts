import type { Theme } from './themeTypes';
import { CURATED_FONTS } from './themeTypes';

const BRAND_SANS = CURATED_FONTS[0].stack;

/**
 * "Classic" is the regression reference: run through themeToCss it reproduces the
 * paper-palette values in tokens.css character-for-character (the alpha tiers derive
 * from muted = foreground = #0b0f1f; the gradient triple is the brand gradient
 * verbatim). Do not tweak these values — documents rendered with Classic must be
 * pixel-equivalent to documents rendered before themes existed.
 */
export const CLASSIC_THEME: Theme = {
  id: 'classic',
  name: 'Classic',
  isBuiltIn: true,
  colors: {
    background: '#f7f7fa',
    foreground: '#0b0f1f',
    accent: '#6366f1',
    muted: '#0b0f1f',
    gradient: ['#6366f1', '#8b5cf6', '#06b6d4'],
  },
  fonts: { display: BRAND_SANS, body: BRAND_SANS },
  coverPage: { fullBleedBackground: false },
};

/**
 * A genuinely dark document — richer than a naive inversion. Background sits slightly
 * violet of the chrome ink so the page still reads as "paper" against the tool; the
 * accent steps up to the brand's soft indigo (#818cf8) because #6366f1 only reaches
 * ~4.2:1 on this background; the gradient uses the brand's soft triple (the site's own
 * gradient-text pairing for dark surfaces). Verified contrast on #0d1226: body text
 * rgba(#eef0fa, .72) ≈ 8.8:1, soft text ≈ 6.4:1, accent #818cf8 ≈ 6.2:1 — all ≥ AA.
 */
export const DARK_THEME: Theme = {
  id: 'dark',
  name: 'Dark',
  isBuiltIn: true,
  colors: {
    background: '#0d1226',
    foreground: '#f5f6fb',
    accent: '#818cf8',
    muted: '#eef0fa',
    gradient: ['#818cf8', '#a78bfa', '#22d3ee'],
  },
  fonts: { display: BRAND_SANS, body: BRAND_SANS },
  coverPage: { fullBleedBackground: true },
};

/** Built-ins in display order. Immutable: never edited, overwritten, or deleted. */
export const BUILT_IN_THEMES: readonly Theme[] = [CLASSIC_THEME, DARK_THEME];

export function getBuiltInTheme(id: string): Theme | undefined {
  return BUILT_IN_THEMES.find((theme) => theme.id === id);
}
