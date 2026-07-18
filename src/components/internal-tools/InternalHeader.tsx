'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './InternalShell.module.css';

// Persistent internal-tools nav: brand → hub, one link per tool with an active state,
// and log out. This is the "one way back to home from anywhere" the marketing Nav used
// to (accidentally) provide — now purpose-built for the internal area.
const TOOLS = [
  { href: '/internal/documents', label: 'Documents' },
  { href: '/internal/slides', label: 'Presentations' },
  { href: '/internal/site-audit', label: 'Site Audit' },
  { href: '/internal/crm', label: 'CRM' },
  { href: '/internal/budgets', label: 'Budgets' },
  { href: '/internal/theme-editor', label: 'Themes' },
  { href: '/internal/backgrounds', label: 'Backgrounds' },
];

const SETTINGS_HREF = '/internal/settings';

export default function InternalHeader({ email }: { email?: string }) {
  const pathname = usePathname();
  const settingsActive =
    pathname === SETTINGS_HREF || pathname.startsWith(`${SETTINGS_HREF}/`);

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/internal" className={styles.brand} aria-label="Internal tools home">
          <span className={styles.wordmark}>BYTEFLOW</span>
          <span className={styles.brandTag}>Internal</span>
        </Link>

        <nav className={styles.nav} aria-label="Internal tools">
          {TOOLS.map((tool) => {
            const active =
              pathname === tool.href || pathname.startsWith(`${tool.href}/`);
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {tool.label}
              </Link>
            );
          })}
        </nav>

        {/* Settings sits with the session controls rather than in the tools nav above: it
            configures the account, it isn't a tool you go and do work in. */}
        <div className={styles.session}>
          {email && <span className={styles.sessionEmail}>{email}</span>}
          <Link
            href={SETTINGS_HREF}
            className={`${styles.settingsLink} ${settingsActive ? styles.settingsLinkActive : ''}`}
            aria-current={settingsActive ? 'page' : undefined}
          >
            Settings
          </Link>
          <form method="post" action="/api/internal-logout">
            <button type="submit" className={styles.logout}>
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
