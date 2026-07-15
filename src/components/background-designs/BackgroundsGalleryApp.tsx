'use client';

// Browsable gallery of all 20 built-in background designs — /internal/backgrounds. Lets
// Tyrone see the whole catalog at once, preview how each recolors under any saved theme,
// and check legibility against a realistic title before picking one in an actual document
// or deck. Purely a preview surface — selecting a theme here doesn't change anything
// elsewhere; the picker at each real integration point (a document page's toolbar, a
// slide's field panel) is where a design actually gets applied.

import { useState } from 'react';
import '@/components/internal-tools/tokens.css';
import styles from './BackgroundsGalleryApp.module.css';
import { BACKGROUND_DESIGNS } from '@/lib/background-designs/registry';
import ThemePicker from '@/components/internal-tools/themes/ThemePicker';
import { resolveTheme } from '@/components/internal-tools/themes/themeStorage';

const SAMPLE_TITLES = ['Q3 Partnership Update', 'A Comprehensive Strategic Proposal for Digital Transformation'];

export default function BackgroundsGalleryApp() {
  const [themeId, setThemeId] = useState('classic');
  const [titleIndex, setTitleIndex] = useState(0);
  const { theme, missing } = resolveTheme(themeId);

  return (
    <div className="bfScope">
      <header className={styles.header}>
        <div>
          <h1 className={styles.heading}>Background designs</h1>
          <p className={styles.subhead}>
            All 20 built-in decorative backgrounds, previewed under any theme. Each recolors
            entirely from the selected theme&apos;s colors — nothing here is hardcoded per
            design. Pick one at the actual page/slide it belongs to (Documents or
            Presentations); this page is preview-only.
          </p>
        </div>
        <div className={styles.controls}>
          <div>
            <label htmlFor="gallery-theme" className={styles.controlLabel}>
              Preview theme
            </label>
            <ThemePicker id="gallery-theme" value={themeId} onChange={setThemeId} missing={missing} />
          </div>
          <div>
            <span className={styles.controlLabel}>Sample title</span>
            <div className={styles.titleToggle}>
              <button
                type="button"
                className={titleIndex === 0 ? styles.titleToggleActive : ''}
                onClick={() => setTitleIndex(0)}
              >
                Short
              </button>
              <button
                type="button"
                className={titleIndex === 1 ? styles.titleToggleActive : ''}
                onClick={() => setTitleIndex(1)}
              >
                Long
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.grid}>
        {BACKGROUND_DESIGNS.map((design) => (
          <div key={design.id} className={styles.card}>
            <div className={styles.canvas} style={{ background: theme.colors.background }}>
              <div aria-hidden dangerouslySetInnerHTML={{ __html: design.renderSvg(theme, 960, 540) }} />
              <p className={styles.sampleTitle} style={{ color: theme.colors.foreground, fontFamily: theme.fonts.display }}>
                {SAMPLE_TITLES[titleIndex]}
              </p>
            </div>
            <p className={styles.cardName} style={{ color: theme.colors.accent }}>
              {design.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
