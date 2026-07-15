'use client';

import { useMemo, useRef, useState } from 'react';
import '@/components/internal-tools/tokens.css';
import styles from './ThemeEditorApp.module.css';
import SampleDocument from './SampleDocument';
import ConfirmDialog from '@/components/internal-tools/ConfirmDialog';
import ThemedDocument from '@/components/internal-tools/themes/ThemedDocument';
import CoverPage from '@/components/internal-tools/themes/CoverPage';
import { BUILT_IN_THEMES, CLASSIC_THEME, getBuiltInTheme } from '@/components/internal-tools/themes/builtInThemes';
import {
  deleteCustomTheme,
  getCustomTheme,
  parseThemeImport,
  saveCustomTheme,
  themeToJson,
  useCustomThemes,
} from '@/components/internal-tools/themes/themeStorage';
import { CURATED_FONTS, HEX_COLOR_RE } from '@/components/internal-tools/themes/themeTypes';
import type { Theme, ThemeColors } from '@/components/internal-tools/themes/themeTypes';
import { contrastRatio, formatRatio, WCAG_AA_NORMAL } from '@/components/internal-tools/themes/contrast';

type ColorKey = 'background' | 'foreground' | 'accent' | 'muted';

const COLOR_FIELDS: { key: ColorKey; label: string; hint: string }[] = [
  { key: 'background', label: 'Background', hint: 'document page' },
  { key: 'foreground', label: 'Foreground', hint: 'headings, primary text' },
  { key: 'accent', label: 'Accent', hint: 'labels, numbers, bullets' },
  { key: 'muted', label: 'Muted base', hint: 'secondary text & hairlines derive from this' },
];

interface PendingSave {
  theme: Theme;
  overwriteName: string;
}

/**
 * /internal/theme-editor — create and maintain custom document themes without code.
 * Single screen: start-from + name + four validated color pairs + curated fonts +
 * cover style on the left, always-live preview (cover + fixed sample document) on the
 * right. Custom themes persist to localStorage (bf-themes:*) with JSON export/import
 * as the portability story. Built-ins are immutable — editing one always saves a new
 * custom theme.
 */
export default function ThemeEditorApp() {
  const customThemes = useCustomThemes();

  const [baseId, setBaseId] = useState(CLASSIC_THEME.id);
  const [baseTheme, setBaseTheme] = useState<Theme>(CLASSIC_THEME);
  const [name, setName] = useState('');
  const [colors, setColors] = useState<ThemeColors>({ ...CLASSIC_THEME.colors });
  // Hex text drafts may be transiently invalid while typing; colors only ever holds
  // validated values (guardrail: invalid input never reaches a style).
  const [hexDrafts, setHexDrafts] = useState<Record<ColorKey, string>>({
    background: CLASSIC_THEME.colors.background,
    foreground: CLASSIC_THEME.colors.foreground,
    accent: CLASSIC_THEME.colors.accent,
    muted: CLASSIC_THEME.colors.muted,
  });
  const [fonts, setFonts] = useState({ ...CLASSIC_THEME.fonts });
  const [fullBleed, setFullBleed] = useState(CLASSIC_THEME.coverPage.fullBleedBackground);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingSave, setPendingSave] = useState<PendingSave | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Theme | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingSave | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const loadTheme = (theme: Theme) => {
    setBaseId(theme.id);
    setBaseTheme(theme);
    setName(theme.isBuiltIn ? '' : theme.name);
    setColors({ ...theme.colors });
    setHexDrafts({
      background: theme.colors.background,
      foreground: theme.colors.foreground,
      accent: theme.colors.accent,
      muted: theme.colors.muted,
    });
    setFonts({ ...theme.fonts });
    setFullBleed(theme.coverPage.fullBleedBackground);
    setStatus(null);
    setError(null);
  };

  const onStartFrom = (id: string) => {
    const theme = getBuiltInTheme(id) ?? getCustomTheme(id);
    if (theme) loadTheme(theme);
  };

  const setColor = (key: ColorKey, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
    setHexDrafts((prev) => ({ ...prev, [key]: value }));
  };

  const onHexDraft = (key: ColorKey, value: string) => {
    setHexDrafts((prev) => ({ ...prev, [key]: value }));
    if (HEX_COLOR_RE.test(value)) {
      setColors((prev) => ({ ...prev, [key]: value }));
    }
  };

  /**
   * The signature gradient follows the base theme while the accent is untouched (so
   * "Classic but serif" keeps the brand tri-color keyline); an edited accent switches
   * to an accent-derived gradient via themeToCss's fallback.
   */
  const draftTheme: Theme = useMemo(() => {
    const keepGradient = colors.accent === baseTheme.colors.accent;
    return {
      id: 'draft-preview',
      name: name.trim() || 'Untitled theme',
      isBuiltIn: false,
      colors: {
        background: colors.background,
        foreground: colors.foreground,
        accent: colors.accent,
        muted: colors.muted,
        ...(keepGradient && baseTheme.colors.gradient
          ? { gradient: baseTheme.colors.gradient }
          : {}),
      },
      fonts: { ...fonts },
      coverPage: { fullBleedBackground: fullBleed },
    };
  }, [colors, fonts, fullBleed, name, baseTheme]);

  const contrasts = useMemo(
    () => [
      {
        label: 'Body text on background',
        ratio: contrastRatio(colors.foreground, colors.background),
      },
      {
        label: 'Accent text on background',
        ratio: contrastRatio(colors.accent, colors.background),
      },
      {
        label: 'Foreground on accent',
        ratio: contrastRatio(colors.foreground, colors.accent),
      },
    ],
    [colors],
  );

  const buildThemeForSave = (): { theme: Theme } | { problem: string } => {
    const trimmed = name.trim();
    if (!trimmed) return { problem: 'Give the theme a name before saving.' };
    if (BUILT_IN_THEMES.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      return { problem: `"${trimmed}" is a built-in theme name — pick another.` };
    }
    for (const key of ['background', 'foreground', 'accent', 'muted'] as const) {
      if (!HEX_COLOR_RE.test(colors[key])) {
        return { problem: `${key} is not a valid 6-digit hex color.` };
      }
    }
    const existing = customThemes.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    return {
      theme: {
        ...draftTheme,
        id: existing ? existing.id : crypto.randomUUID(),
        name: trimmed,
      },
    };
  };

  const onSave = () => {
    setError(null);
    setStatus(null);
    const result = buildThemeForSave();
    if ('problem' in result) {
      setError(result.problem);
      return;
    }
    const overwriting = customThemes.find((t) => t.id === result.theme.id);
    if (overwriting) {
      setPendingSave({ theme: result.theme, overwriteName: overwriting.name });
      return;
    }
    persist(result.theme);
  };

  const persist = (theme: Theme) => {
    const saved = saveCustomTheme(theme);
    if (!saved.ok) {
      setError(saved.error);
      return;
    }
    setPendingSave(null);
    loadTheme(theme);
    setStatus(`Saved "${theme.name}".`);
  };

  const onExport = () => {
    setError(null);
    const result = buildThemeForSave();
    if ('problem' in result) {
      setError(result.problem);
      return;
    }
    const blob = new Blob([themeToJson(result.theme)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bf-theme-${result.theme.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus(`Exported "${result.theme.name}".`);
  };

  const onImportFile = async (file: File) => {
    setError(null);
    setStatus(null);
    const text = await file.text();
    const result = parseThemeImport(text);
    if (!result.theme) {
      setError(result.error);
      return;
    }
    const imported = result.theme;
    const collision = customThemes.find(
      (t) => t.id === imported.id || t.name.toLowerCase() === imported.name.toLowerCase(),
    );
    if (collision) {
      setPendingImport({
        theme: { ...imported, id: collision.id },
        overwriteName: collision.name,
      });
      return;
    }
    persistImport(imported);
  };

  const persistImport = (theme: Theme) => {
    const saved = saveCustomTheme(theme);
    if (!saved.ok) {
      setError(saved.error);
      return;
    }
    setPendingImport(null);
    loadTheme(theme);
    setStatus(`Imported "${theme.name}".`);
  };

  const editingCustom = customThemes.find((t) => t.id === baseId);

  return (
    <div className={`bfScope ${styles.app}`}>
      <header className={styles.toolbar}>
        <div>
          <h1 className={styles.title}>Theme Editor</h1>
          <p className={styles.subtitle}>
            Custom document themes for proposals and audits — saved in this browser,
            portable as JSON.
          </p>
        </div>
        <div className={styles.toolbarActions}>
          {status && (
            <p className={styles.status} role="status">
              {status}
            </p>
          )}
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className={styles.hiddenFile}
            aria-label="Import theme JSON file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void onImportFile(file);
            }}
          />
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => importInputRef.current?.click()}
          >
            Import…
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onExport}>
            Export JSON
          </button>
          {editingCustom && (
            <button
              type="button"
              className={styles.dangerButton}
              onClick={() => setPendingDelete(editingCustom)}
            >
              Delete
            </button>
          )}
          <button type="button" className={styles.saveButton} onClick={onSave}>
            Save theme
          </button>
        </div>
      </header>

      <div className={styles.panes}>
        <section className={styles.formPane} aria-label="Theme settings">
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Theme</h2>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="te-base">
                Start from
              </label>
              <select
                id="te-base"
                className={styles.select}
                value={baseId}
                onChange={(event) => onStartFrom(event.target.value)}
              >
                {BUILT_IN_THEMES.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name} (built-in)
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
            </div>
            <div className={styles.field}>
              <label className={`${styles.label} ${styles.required}`} htmlFor="te-name">
                Theme name
              </label>
              <input
                id="te-name"
                className={styles.input}
                type="text"
                value={name}
                maxLength={60}
                placeholder="e.g. Slate Pitch"
                onChange={(event) => setName(event.target.value)}
              />
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Colors</h2>
            {COLOR_FIELDS.map(({ key, label, hint }) => {
              const invalid = !HEX_COLOR_RE.test(hexDrafts[key]);
              return (
                <div className={styles.colorRow} key={key}>
                  <label className={styles.label} htmlFor={`te-hex-${key}`}>
                    {label}
                    <span className={styles.hint}> — {hint}</span>
                  </label>
                  <div className={styles.colorControls}>
                    <input
                      type="color"
                      className={styles.swatch}
                      value={colors[key]}
                      aria-label={`${label} color picker`}
                      onChange={(event) => setColor(key, event.target.value)}
                    />
                    <input
                      id={`te-hex-${key}`}
                      type="text"
                      className={`${styles.input} ${styles.hexInput} ${invalid ? styles.inputInvalid : ''}`}
                      value={hexDrafts[key]}
                      spellCheck={false}
                      onChange={(event) => onHexDraft(key, event.target.value)}
                      onBlur={() =>
                        setHexDrafts((prev) => ({ ...prev, [key]: colors[key] }))
                      }
                    />
                  </div>
                  {invalid && (
                    <p className={styles.fieldError}>Hex colors look like #0b0f1f.</p>
                  )}
                </div>
              );
            })}

            <div className={styles.contrastBox} aria-live="polite">
              {contrasts.map(({ label, ratio }) => {
                const pass = ratio >= WCAG_AA_NORMAL;
                return (
                  <p
                    key={label}
                    className={`${styles.contrastLine} ${pass ? '' : styles.contrastWarn}`}
                  >
                    {pass ? '✓' : '⚠'} {label}: {formatRatio(ratio)}
                    {!pass && ' — below WCAG AA (4.5:1)'}
                  </p>
                );
              })}
              <p className={styles.contrastNote}>
                Informational only — saving is never blocked.
              </p>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Fonts</h2>
            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="te-font-display">
                  Display (headings)
                </label>
                <select
                  id="te-font-display"
                  className={styles.select}
                  value={fonts.display}
                  onChange={(event) => setFonts((f) => ({ ...f, display: event.target.value }))}
                >
                  {CURATED_FONTS.map((font) => (
                    <option key={font.id} value={font.stack}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="te-font-body">
                  Body
                </label>
                <select
                  id="te-font-body"
                  className={styles.select}
                  value={fonts.body}
                  onChange={(event) => setFonts((f) => ({ ...f, body: event.target.value }))}
                >
                  {CURATED_FONTS.map((font) => (
                    <option key={font.id} value={font.stack}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Cover page</h2>
            <label className={styles.checkboxLabel} htmlFor="te-fullbleed">
              <input
                id="te-fullbleed"
                type="checkbox"
                className={styles.checkbox}
                checked={fullBleed}
                onChange={(event) => setFullBleed(event.target.checked)}
              />
              Full-bleed background (theme color + brand wash across the whole cover)
            </label>
          </div>
        </section>

        <section className={styles.previewPane} aria-label="Live theme preview">
          <div className={styles.previewScale}>
            <ThemedDocument theme={draftTheme}>
              <CoverPage
                label="Sample"
                title="[Sample document title]"
                clientName="[Client name]"
                date=""
                theme={draftTheme}
              />
              <SampleDocument />
            </ThemedDocument>
          </div>
        </section>
      </div>

      {pendingSave && (
        <ConfirmDialog
          title="Overwrite theme?"
          body={`A theme named "${pendingSave.overwriteName}" already exists. Overwriting updates every document that uses it.`}
          confirmLabel="Overwrite"
          onConfirm={() => persist(pendingSave.theme)}
          onCancel={() => setPendingSave(null)}
        />
      )}
      {pendingImport && (
        <ConfirmDialog
          title="Replace existing theme?"
          body={`The imported file matches your existing theme "${pendingImport.overwriteName}". Replacing updates every document that uses it.`}
          confirmLabel="Replace"
          onConfirm={() => persistImport(pendingImport.theme)}
          onCancel={() => setPendingImport(null)}
        />
      )}
      {pendingDelete && (
        <ConfirmDialog
          title={`Delete "${pendingDelete.name}"?`}
          body="This removes the theme from this browser. Documents that use it fall back to Classic. Export it first if you might want it back."
          confirmLabel="Delete theme"
          danger
          onConfirm={() => {
            deleteCustomTheme(pendingDelete.id);
            setPendingDelete(null);
            loadTheme(CLASSIC_THEME);
            setStatus(`Deleted "${pendingDelete.name}".`);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
