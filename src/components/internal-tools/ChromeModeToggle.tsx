'use client';

import { useEffect, useState } from 'react';
import styles from './ChromeModeToggle.module.css';

// App-chrome dark/light switch — chrome ONLY (hub, forms, nav). Documents render
// through ThemedDocument's inline-pinned variables and never react to this. Distinct
// system from document themes on purpose: different storage key (bf-app-dark-mode),
// different attribute (html[data-bf-chrome]), different control (this one lives on
// the hub). Dark is the default and matches the chrome as it has always looked; the
// (protected) layout sets the attribute pre-paint so light mode doesn't flash dark.

const STORAGE_KEY = 'bf-app-dark-mode';

function applyMode(dark: boolean): void {
  if (dark) {
    document.documentElement.removeAttribute('data-bf-chrome');
  } else {
    document.documentElement.setAttribute('data-bf-chrome', 'light');
  }
}

export default function ChromeModeToggle() {
  // Render deterministically as dark for SSR; sync from storage after mount.
  const [dark, setDark] = useState(true);

  useEffect(() => {
    try {
      setDark(window.localStorage.getItem(STORAGE_KEY) !== 'false');
    } catch {
      // Storage unavailable: stay on the dark default.
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    applyMode(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // Non-persistent is still functional for this tab.
    }
  };

  return (
    <button
      type="button"
      className={styles.toggle}
      role="switch"
      aria-checked={dark}
      onClick={toggle}
    >
      <span aria-hidden className={styles.icon}>
        {dark ? '☾' : '☀'}
      </span>
      Dark chrome: {dark ? 'on' : 'off'}
    </button>
  );
}
