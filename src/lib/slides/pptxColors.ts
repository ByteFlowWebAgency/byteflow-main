// Theme → pptxgenjs value helpers. Two documented pptxgenjs gotchas live here and ONLY
// here (docs/slides/05-PPTX-EXPORT.md) — every color/font value used by a generator
// function must route through these, never hand-rolled inline.

import type { Theme } from '@/components/internal-tools/themes/themeTypes';
import { CURATED_FONTS } from '@/components/internal-tools/themes/themeTypes';

/**
 * Gotcha #1: pptxgenjs wants hex colors WITHOUT a leading '#' ("1A2B3C", not "#1A2B3C").
 * The theme system stores colors WITH the '#' (HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/). Strip
 * it here, at the export boundary, and nowhere else.
 */
export function toPptxColor(hex: string): string {
  return hex.startsWith('#') ? hex.slice(1) : hex;
}

/**
 * theme.fonts.display/body are CSS stack strings (e.g. "var(--font-jakarta), system-ui,
 * ..."), not plain font names — pptxgenjs's fontFace needs an actual font name PowerPoint
 * can resolve. Map each curated stack (by its stable `id`) to a real font name. Falls back
 * to "Arial" for any stack that doesn't match a known curated font (should never happen
 * for a theme that passed validateTheme, which only accepts CURATED_FONT_STACKS values).
 */
const FONT_NAME_BY_CURATED_ID: Record<string, string> = {
  'brand-sans': 'Plus Jakarta Sans',
  'brand-mono': 'JetBrains Mono',
  'system-sans': 'Arial',
  'system-serif': 'Georgia',
};

function fontNameForStack(stack: string): string {
  const match = CURATED_FONTS.find((f) => f.stack === stack);
  return (match && FONT_NAME_BY_CURATED_ID[match.id]) || 'Arial';
}

export function pptxDisplayFont(theme: Theme): string {
  return fontNameForStack(theme.fonts.display);
}

export function pptxBodyFont(theme: Theme): string {
  return fontNameForStack(theme.fonts.body);
}
