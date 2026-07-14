'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Theme } from './themeTypes';
import { validateTheme } from './themeTypes';
import { BUILT_IN_THEMES, CLASSIC_THEME, getBuiltInTheme } from './builtInThemes';

// Custom-theme persistence: one localStorage key per theme under the bf-themes:
// prefix, plus JSON export/import as the cross-browser portability story. Only keys
// with this exact prefix are ever read or written — nothing else in localStorage is
// touched, wiped, or migrated. Built-ins never enter storage.

const PREFIX = 'bf-themes:';
/** Same-tab change signal (the native 'storage' event only fires in *other* tabs). */
const CHANGE_EVENT = 'bf-themes-changed';

function storageAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage;
}

function emitChange(): void {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/** All stored custom themes, alphabetical. Corrupt/foreign entries are skipped, never thrown on. */
export function listCustomThemes(): Theme[] {
  if (!storageAvailable()) return [];
  const themes: Theme[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(PREFIX)) continue;
    try {
      const { theme } = validateTheme(JSON.parse(window.localStorage.getItem(key) ?? ''));
      if (theme) themes.push(theme);
    } catch {
      // Unreadable entry: leave it in place (never destroy data), just don't list it.
    }
  }
  return themes.sort((a, b) => a.name.localeCompare(b.name));
}

export function getCustomTheme(id: string): Theme | undefined {
  if (!storageAvailable()) return undefined;
  const raw = window.localStorage.getItem(PREFIX + id);
  if (!raw) return undefined;
  try {
    return validateTheme(JSON.parse(raw)).theme;
  } catch {
    return undefined;
  }
}

/** Built-ins first, then storage. */
export function getThemeById(id: string): Theme | undefined {
  return getBuiltInTheme(id) ?? getCustomTheme(id);
}

/**
 * A document's themeId → the Theme to render with. A deleted custom theme falls back
 * to Classic with `missing: true` so callers can show the small inline note — never a
 * crash, never a half-rendered document.
 */
export function resolveTheme(id: string | undefined): { theme: Theme; missing: boolean } {
  if (!id) return { theme: CLASSIC_THEME, missing: false };
  const theme = getThemeById(id);
  return theme ? { theme, missing: false } : { theme: CLASSIC_THEME, missing: true };
}

/** Validates before writing; refuses built-in ids (built-ins are immutable). */
export function saveCustomTheme(theme: Theme): { ok: true } | { ok: false; error: string } {
  if (!storageAvailable()) return { ok: false, error: 'Storage is unavailable in this browser.' };
  if (getBuiltInTheme(theme.id)) {
    return { ok: false, error: 'Built-in themes cannot be overwritten.' };
  }
  const { theme: valid, error } = validateTheme(theme);
  if (!valid) return { ok: false, error };
  window.localStorage.setItem(PREFIX + valid.id, JSON.stringify(valid));
  emitChange();
  return { ok: true };
}

export function deleteCustomTheme(id: string): void {
  if (!storageAvailable()) return;
  window.localStorage.removeItem(PREFIX + id);
  emitChange();
}

/** Pretty JSON for the .json download. */
export function themeToJson(theme: Theme): string {
  return JSON.stringify(theme, null, 2);
}

/**
 * Parse + validate an imported theme file. All-or-nothing: any problem returns an
 * error and nothing is applied or stored. The caller decides how to handle id/name
 * collisions before saving.
 */
export function parseThemeImport(
  text: string,
): { theme: Theme; error?: never } | { theme?: never; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: 'That file is not valid JSON.' };
  }
  const result = validateTheme(parsed);
  if (!result.theme) return { error: `Not a valid theme file: ${result.error}` };
  const theme = result.theme;
  // An import may not silently shadow a built-in id — re-key it instead.
  if (getBuiltInTheme(theme.id)) {
    return { theme: { ...theme, id: `custom-${theme.id}-${Date.now().toString(36)}` } };
  }
  return { theme };
}

/** Live list of custom themes for pickers/editors — updates on any save/delete, incl. other tabs. */
export function useCustomThemes(): Theme[] {
  const [themes, setThemes] = useState<Theme[]>([]);
  const refresh = useCallback(() => setThemes(listCustomThemes()), []);
  useEffect(() => {
    refresh();
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);
  return themes;
}

export { BUILT_IN_THEMES, CLASSIC_THEME };
