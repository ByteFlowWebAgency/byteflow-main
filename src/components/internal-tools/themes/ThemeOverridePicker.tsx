'use client';

import styles from './ThemePicker.module.css';
import { BUILT_IN_THEMES } from './builtInThemes';
import { useCustomThemes } from './themeStorage';

interface ThemeOverridePickerProps {
  id: string;
  /** undefined = inherit the parent document/deck's theme (the default for every page/
   * slide until explicitly overridden). */
  value: string | undefined;
  onChange: (themeId: string | undefined) => void;
  /** True when the page/slide references an override theme that no longer exists. */
  missing?: boolean;
  className?: string;
}

/**
 * Per-page/per-slide theme override picker — same option list as ThemePicker, plus a
 * leading "inherit" option that clears the override. Used wherever a page/slide can
 * optionally diverge from its document/deck's overall theme.
 */
export default function ThemeOverridePicker({ id, value, onChange, missing, className }: ThemeOverridePickerProps) {
  const customThemes = useCustomThemes();

  return (
    <div className={styles.picker}>
      <select
        id={id}
        className={className ?? styles.select}
        value={missing ? '' : (value ?? '')}
        onChange={(event) => onChange(event.target.value || undefined)}
      >
        <option value="">Use document/deck theme</option>
        {BUILT_IN_THEMES.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.name}
          </option>
        ))}
        {customThemes.length > 0 && (
          <optgroup label="Custom themes">
            {customThemes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      {missing && (
        <p className={styles.note} role="status">
          The saved override theme was deleted — inheriting the document/deck theme.
        </p>
      )}
    </div>
  );
}
