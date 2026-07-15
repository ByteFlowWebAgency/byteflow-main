// The document theme model. A theme is a small typed bundle of the same CSS custom
// properties the document components already read (see themeToCss.ts for the exact
// mapping). Themes restyle *documents* (proposals, audits); they are a separate system
// from the internal app chrome and never touch it.

export interface ThemeColors {
  /** Document page background. Hex #rrggbb. */
  background: string;
  /** Primary text. Hex #rrggbb. */
  foreground: string;
  /** Accent — doc labels, phase numbers, bullets. Hex #rrggbb. */
  accent: string;
  /**
   * Base color for secondary text, hairlines, and card washes — the alpha tiers
   * (72/60/16/8/4%) derive from this. Usually equals `foreground`; kept separate so a
   * theme can cool/warm its secondary tones without touching headings.  Hex #rrggbb.
   */
  muted: string;
  /**
   * Optional exact 3-stop signature gradient (keylines, section kicks). Built-ins carry
   * the brand triple; when absent the gradient derives from `accent` so custom themes
   * stay coherent without exposing another control.
   */
  gradient?: [string, string, string];
}

export interface Theme {
  id: string;
  name: string;
  isBuiltIn: boolean;
  colors: ThemeColors;
  /** CSS font-family stacks — always one of CURATED_FONTS[].stack, never free text. */
  fonts: { display: string; body: string };
  coverPage: { fullBleedBackground: boolean };
}

/** Strict 6-digit hex — the only color format themes accept (guardrail). */
export const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

export interface CuratedFont {
  id: string;
  label: string;
  stack: string;
}

/**
 * The only fonts a theme may use: the two families the site already loads via
 * next/font (their variables are set on <html> by the root layout) plus pure system
 * stacks. No font files, no loaders, no free-text font input — ever.
 */
export const CURATED_FONTS: CuratedFont[] = [
  {
    id: 'brand-sans',
    label: 'Plus Jakarta Sans (brand)',
    stack: "var(--font-jakarta), system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  {
    id: 'brand-mono',
    label: 'JetBrains Mono (brand mono)',
    stack: 'var(--font-mono), ui-monospace, Menlo, monospace',
  },
  {
    id: 'system-sans',
    label: 'System Sans',
    stack: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  {
    id: 'system-serif',
    label: 'System Serif',
    stack: "Georgia, 'Times New Roman', Times, serif",
  },
];

export const CURATED_FONT_STACKS = new Set(CURATED_FONTS.map((f) => f.stack));

/**
 * Field-by-field validation for anything crossing a trust boundary (JSON import,
 * localStorage reads). Returns a fresh, fully-typed Theme built only from recognized
 * fields — never the input object itself — or a human-readable error. All-or-nothing:
 * a single bad field rejects the whole theme.
 */
export function validateTheme(input: unknown): { theme: Theme; error?: never } | { theme?: never; error: string } {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { error: 'Theme must be a JSON object.' };
  }
  const raw = input as Record<string, unknown>;
  if (typeof raw.id !== 'string' || raw.id.trim() === '') {
    return { error: 'Theme is missing a string "id".' };
  }
  if (typeof raw.name !== 'string' || raw.name.trim() === '' || raw.name.length > 60) {
    return { error: 'Theme "name" must be a non-empty string of at most 60 characters.' };
  }
  const colors = raw.colors as Record<string, unknown> | undefined;
  if (typeof colors !== 'object' || colors === null) {
    return { error: 'Theme is missing its "colors" object.' };
  }
  for (const key of ['background', 'foreground', 'accent', 'muted'] as const) {
    const value = colors[key];
    if (typeof value !== 'string' || !HEX_COLOR_RE.test(value)) {
      return { error: `colors.${key} must be a 6-digit hex color like #0b0f1f.` };
    }
  }
  let gradient: [string, string, string] | undefined;
  if (colors.gradient !== undefined) {
    const g = colors.gradient;
    if (
      !Array.isArray(g) ||
      g.length !== 3 ||
      g.some((stop) => typeof stop !== 'string' || !HEX_COLOR_RE.test(stop))
    ) {
      return { error: 'colors.gradient, when present, must be exactly three hex colors.' };
    }
    gradient = [g[0], g[1], g[2]];
  }
  const fonts = raw.fonts as Record<string, unknown> | undefined;
  if (typeof fonts !== 'object' || fonts === null) {
    return { error: 'Theme is missing its "fonts" object.' };
  }
  for (const key of ['display', 'body'] as const) {
    const value = fonts[key];
    if (typeof value !== 'string' || !CURATED_FONT_STACKS.has(value)) {
      return { error: `fonts.${key} is not one of the curated fonts.` };
    }
  }
  const coverPage = raw.coverPage as Record<string, unknown> | undefined;
  if (typeof coverPage !== 'object' || coverPage === null || typeof coverPage.fullBleedBackground !== 'boolean') {
    return { error: 'coverPage.fullBleedBackground must be true or false.' };
  }
  return {
    theme: {
      id: raw.id.trim(),
      name: raw.name.trim(),
      // Imported/stored themes are never built-in, whatever the JSON claims.
      isBuiltIn: false,
      colors: {
        background: colors.background as string,
        foreground: colors.foreground as string,
        accent: colors.accent as string,
        muted: colors.muted as string,
        ...(gradient ? { gradient } : {}),
      },
      fonts: { display: fonts.display as string, body: fonts.body as string },
      coverPage: { fullBleedBackground: coverPage.fullBleedBackground as boolean },
    },
  };
}
