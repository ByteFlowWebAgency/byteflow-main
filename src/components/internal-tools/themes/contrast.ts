// WCAG 2.x contrast math for the theme editor's informational warnings.

function channelToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const r = channelToLinear(parseInt(hex.slice(1, 3), 16));
  const g = channelToLinear(parseInt(hex.slice(3, 5), 16));
  const b = channelToLinear(parseInt(hex.slice(5, 7), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two #rrggbb colors, 1..21. */
export function contrastRatio(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  const [lighter, darker] = la >= lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

/** "6.24:1" */
export function formatRatio(ratio: number): string {
  return `${(Math.round(ratio * 100) / 100).toFixed(2)}:1`;
}

/** AA threshold for normal body text. */
export const WCAG_AA_NORMAL = 4.5;
