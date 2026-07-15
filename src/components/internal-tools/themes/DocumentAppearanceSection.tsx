'use client';

import styles from './DocumentAppearanceSection.module.css';
import ThemePicker from './ThemePicker';
import { getBuiltInTheme } from './builtInThemes';
import { useCustomThemes } from './themeStorage';

interface DocumentAppearanceSectionProps {
  /** Unique per tool so label htmlFor ids never collide ("pt", "au"). */
  idPrefix: string;
  themeId: string;
  onThemeChange: (themeId: string) => void;
  /** Cover-page toggle — wired by the tools once cover pages exist on the data types. */
  includeCoverPage?: boolean;
  onIncludeCoverPageChange?: (include: boolean) => void;
}

/**
 * The "Appearance" form card both document tools share: theme choice now, cover-page
 * toggle alongside it. Document-type-agnostic — it only knows ids and callbacks.
 * Styling mirrors the tools' own form-section conventions so it reads as native in
 * either form.
 */
export default function DocumentAppearanceSection({
  idPrefix,
  themeId,
  onThemeChange,
  includeCoverPage,
  onIncludeCoverPageChange,
}: DocumentAppearanceSectionProps) {
  const customThemes = useCustomThemes();
  const missing = !getBuiltInTheme(themeId) && !customThemes.some((t) => t.id === themeId);

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Appearance</h2>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor={`${idPrefix}-theme`} className={styles.label}>
            Document theme
          </label>
          <ThemePicker
            id={`${idPrefix}-theme`}
            value={themeId}
            onChange={onThemeChange}
            missing={missing}
          />
        </div>
        {onIncludeCoverPageChange && (
          <label className={styles.checkboxLabel} htmlFor={`${idPrefix}-cover`}>
            <input
              id={`${idPrefix}-cover`}
              type="checkbox"
              className={styles.checkbox}
              checked={includeCoverPage ?? false}
              onChange={(event) => onIncludeCoverPageChange(event.target.checked)}
            />
            Include cover page
          </label>
        )}
      </div>
    </section>
  );
}
