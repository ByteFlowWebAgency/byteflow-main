'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './InternalShell.module.css';

// Persistent internal-tools nav: brand → hub, one link per tool with an active state,
// and log out. This is the "one way back to home from anywhere" the marketing Nav used
// to (accidentally) provide — now purpose-built for the internal area.
const TOOLS = [
  { href: '/internal/proposal-tool', label: 'Proposals' },
  { href: '/internal/audits', label: 'Site Audits' },
  { href: '/internal/crm', label: 'CRM' },
  { href: '/internal/budgets', label: 'Budgets' },
  { href: '/internal/theme-editor', label: 'Themes' },
];

export default function InternalHeader() {
  const pathname = usePathname();

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

        <form method="post" action="/api/internal-logout">
          <button type="submit" className={styles.logout}>
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
