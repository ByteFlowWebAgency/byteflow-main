// Background Designs data model — decorative, theme-recoloring page/slide backgrounds,
// independent of the Theme schema itself (see docs/background-designs/DISCOVERY.md and the
// mega prompt's HARD GUARDRAILS: never add fields to Theme, never touch tokens.css or the
// theme editor). A design is a pure function of (theme, dimensions) that returns a complete
// SVG string, colored entirely from theme.colors — that single definition renders live for
// on-screen preview and PDF export, and gets rasterized to a PNG for the PPTX path
// (rasterize.ts). There is exactly one implementation per design, never two.

import type { Theme } from '@/components/internal-tools/themes/themeTypes';

export interface BackgroundDesign {
  /** Stable slug — matches a doc/slide's stored backgroundDesignId. */
  id: string;
  /** Display name for the picker. */
  name: string;
  /**
   * Returns a complete `<svg>...</svg>` string sized to width/height, colored only from
   * theme.colors (accent, gradient, foreground/background/muted at reduced opacity) — no
   * hardcoded colors, ever.
   */
  renderSvg(theme: Theme, width: number, height: number): string;
}
