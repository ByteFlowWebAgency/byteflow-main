import type { Metadata } from 'next';
import '@/components/internal-tools/tokens.css';
import HubTile from '@/components/internal-tools/HubTile';
import styles from './hub.module.css';

export const metadata: Metadata = {
  title: 'Internal Tools · ByteFlow',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

// The /internal hub — the shared entry point to the gated tools. The app shell
// (header/footer) is provided by the (protected) layout; this page is just the landing
// masthead plus the tool tiles.
export default function InternalHubPage() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1 className={styles.heading}>Internal Tools</h1>
          <p className={styles.subhead}>
            Everything the ByteFlow team uses to run the pipeline and produce client
            documents — in one place.
          </p>
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
            title="CRM"
            description="Contacts, organizations, and the deal pipeline — who was referred by whom, and what to do today."
            monogram="Cr"
            href="/internal/crm"
            status="live"
          />
          <HubTile
            title="Budgets"
            description="Planned vs. actual by category for project and recurring budgets. Planning only — books stay in QuickBooks."
            monogram="Bu"
            href="/internal/budgets"
            status="live"
          />
          <HubTile
            title="Document Themes"
            description="Create and manage the color and font themes proposals and audits render with — including dark covers for pitch decks."
            monogram="Th"
            href="/internal/theme-editor"
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
