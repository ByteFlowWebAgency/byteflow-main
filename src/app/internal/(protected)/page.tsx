import type { Metadata } from 'next';
import '@/components/internal-tools/tokens.css';
import HubTile from '@/components/internal-tools/HubTile';
import styles from './hub.module.css';

export const metadata: Metadata = {
  title: 'Internal Tools · ByteFlow',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

// The /internal hub — the shared entry point to the gated tools. Calm and utilitarian by
// design: this is an internal dashboard, not a marketing surface.
export default function InternalHubPage() {
  return (
    <main className={`bfScope ${styles.page}`}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div>
            <p className={styles.wordmark}>BYTEFLOW</p>
            <h1 className={styles.heading}>Internal Tools</h1>
          </div>
          <form method="post" action="/api/internal-logout">
            <button type="submit" className={styles.logoutButton}>
              Log out
            </button>
          </form>
        </header>

        <div className={styles.grid}>
          <HubTile
            title="Proposals"
            description="Contract proposals — flat, retainer, or hybrid pricing — with a live branded preview and PDF export."
            monogram="Pr"
            href="/internal/proposal-tool"
            status="live"
          />
          <HubTile
            title="Site Audits"
            description="Prospect site audit reports: findings by category and severity, screenshots, and top recommendations."
            monogram="Au"
            href="/internal/audits"
            status="live"
          />
          <HubTile
            title="Monthly Reports"
            description="Recurring SEO and retainer reporting for active clients."
            monogram="Re"
            status="coming-soon"
          />
          <HubTile
            title="Contracts"
            description="Service agreements assembled from a clause library."
            monogram="Co"
            status="coming-soon"
          />
          <HubTile
            title="Draft Emails"
            description="Outreach and follow-up drafts that match the documents they accompany."
            monogram="Em"
            status="coming-soon"
          />
        </div>
      </div>
    </main>
  );
}
