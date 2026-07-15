'use client';

import styles from './ThemePicker.module.css';
import { BUILT_IN_THEMES } from './builtInThemes';
import { useCustomThemes } from './themeStorage';

interface ThemePickerProps {
  /** Field id so the caller's form label can point at the select. */
  id: string;
  value: string;
  onChange: (themeId: string) => void;
  /** True when the document references a theme that no longer exists. */
  missing?: boolean;
}

/**
 * The per-document theme dropdown both tools share: built-ins first, then custom
 * themes. When the document's saved theme has been deleted the picker keeps working —
 * the document renders with Classic and a small note says why.
 */
export default function ThemePicker({ id, value, onChange, missing }: ThemePickerProps) {
  const customThemes = useCustomThemes();

  return (
    <div className={styles.picker}>
      <select
        id={id}
        className={styles.select}
        value={missing ? 'classic' : value}
        onChange={(event) => onChange(event.target.value)}
      >
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
          The saved theme was deleted — using Classic.
        </p>
      )}
    </div>
  );
}
