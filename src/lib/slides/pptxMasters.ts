// Brand-consistent slide master, defined once per export from the deck's active Theme.
// docs/slides/05-PPTX-EXPORT.md: background from the theme, the real BYTEFLOW logo placed
// consistently, slide numbering — enforced structurally via one pptx.defineSlideMaster()
// call, not re-implemented per slide-template generator function.
//
// A deck has exactly one themeId (not per-slide), so exactly one master is defined per
// export — its content is theme-derived (light vs. dark background handled by reading
// isDarkColor off the active theme), not two hardcoded "classic"/"dark" masters.

import type PptxGenJS from 'pptxgenjs';
import type { Theme } from '@/components/internal-tools/themes/themeTypes';
import { isDarkColor } from '@/components/internal-tools/themes/themeToCss';
import { toPptxColor, pptxBodyFont } from './pptxColors';
import { BYTEFLOW_LOGO_DATA_URL } from './logoDataUrl';

export const SLIDE_W = 13.33;
export const SLIDE_H = 7.5;
export const MARGIN = 0.6;
export const CONTENT_X = MARGIN;
export const CONTENT_W = SLIDE_W - MARGIN * 2;
export const TITLE_Y = 0.5;
export const TITLE_H = 0.9;
export const BODY_TOP = 1.65;
export const BODY_BOTTOM = 6.95;

export const MASTER_NAME = 'BF_SLIDE_MASTER';

/**
 * Known limitation (logged, not silently swept under the rug — see docs/slides/HANDOFF.md):
 * the real logo asset (public/BYTEFLOW_LOGO.png) is a colored indigo mark, not white. The
 * web preview knocks it out to white on dark themes via a CSS filter; pptxgenjs embeds the
 * raw image bytes with no equivalent filter, and adding one would mean either a new image-
 * processing dependency (not approved tonight) or a hand-authored second logo asset (not
 * ours to fabricate). The logo therefore renders identically on every theme in the .pptx —
 * legible on light backgrounds, lower-contrast on dark ones. Worth a real white-logo asset
 * in a future pass if dark-themed decks become common.
 */
const LOGO_SIZE = 0.5; // inches, square

/** Define the one master this export uses, and return its name for addSlide({ masterName }). */
export function defineDeckMaster(pptx: PptxGenJS, theme: Theme): string {
  const dark = isDarkColor(theme.colors.background);
  const fg = toPptxColor(theme.colors.foreground);
  const bg = toPptxColor(theme.colors.background);
  const muted = toPptxColor(theme.colors.muted);

  pptx.defineSlideMaster({
    title: MASTER_NAME,
    background: { color: bg },
    objects: [
      {
        image: {
          data: BYTEFLOW_LOGO_DATA_URL,
          x: SLIDE_W - MARGIN - LOGO_SIZE,
          y: SLIDE_H - MARGIN - LOGO_SIZE,
          w: LOGO_SIZE,
          h: LOGO_SIZE * (196 / 200),
        },
      },
      {
        text: {
          text: 'ByteFlow Solutions',
          options: {
            x: MARGIN,
            y: SLIDE_H - 0.4,
            w: 6,
            h: 0.3,
            fontSize: 9,
            fontFace: pptxBodyFont(theme),
            color: muted,
            align: 'left',
            transparency: dark ? 20 : 30,
          },
        },
      },
    ],
    slideNumber: {
      x: SLIDE_W - 1.1,
      y: SLIDE_H - 0.4,
      w: 0.6,
      h: 0.3,
      fontSize: 9,
      fontFace: pptxBodyFont(theme),
      color: fg,
    },
  });

  return MASTER_NAME;
}
