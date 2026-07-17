import type { Metadata } from 'next';
import '@/components/internal-tools/tokens.css';
import HubTile from '@/components/internal-tools/HubTile';
import ChromeModeToggle from '@/components/internal-tools/ChromeModeToggle';
import MeetingsSectionGate from '@/components/internal-tools/meetings/MeetingsSectionGate';
import styles from './hub.module.css';

export const metadata: Metadata = {
  title: 'Internal Tools · ByteFlow',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

// The /internal hub. Two columns at desk widths: the calendar owns the left, the tools sit
// down the right, sized so the whole page fits one screen without scrolling. Below
// ~1080px the columns stack — a squeezed two-column grid is worse than a scroll.
//
// The Google Calendar connection card used to sit above the meetings; it's on
// /internal/settings now. Connecting is a once-ever action, and a permanent "Connected"
// card was spending the calendar's own space to tell you something you already knew.
export default function InternalHubPage() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div className={styles.headerRow}>
            <h1 className={styles.heading}>Internal Tools</h1>
            <ChromeModeToggle />
          </div>
        </header>

        <div className={styles.columns}>
          <section className={styles.colLeft} aria-labelledby="section-meetings">
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle} id="section-meetings">
                Meetings
              </h2>
              <p className={styles.sectionHint}>What&rsquo;s coming up, and who it&rsquo;s with.</p>
            </div>
            <MeetingsSectionGate />
          </section>

          <div className={styles.colRight}>
            <section className={styles.section} aria-labelledby="section-pipeline">
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle} id="section-pipeline">
                  Pipeline
                </h2>
              </div>
              <div className={styles.grid}>
                <HubTile
                  title="CRM"
                  description="Contacts, organizations, and the deal pipeline."
                  monogram="Cr"
                  href="/internal/crm"
                />
                <HubTile
                  title="Budgets"
                  description="Planned vs. actual by category. Books stay in QuickBooks."
                  monogram="Bu"
                  href="/internal/budgets"
                />
              </div>
            </section>

            <section className={styles.section} aria-labelledby="section-deliverables">
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle} id="section-deliverables">
                  Client deliverables
                </h2>
              </div>
              <div className={styles.grid}>
                <HubTile
                  title="Documents"
                  description="On-brand proposals, audits, briefs and reports, with PDF export."
                  monogram="Dc"
                  href="/internal/documents"
                />
                <HubTile
                  title="Presentations"
                  description="25 branded slide templates; download a real, editable .pptx."
                  monogram="Pr"
                  href="/internal/slides"
                />
              </div>
            </section>

            <section className={styles.section} aria-labelledby="section-brand">
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle} id="section-brand">
                  Brand system
                </h2>
              </div>
              <div className={styles.grid}>
                <HubTile
                  title="Document Themes"
                  description="The colour and font themes documents render with."
                  monogram="Th"
                  href="/internal/theme-editor"
                />
                <HubTile
                  title="Backgrounds"
                  description="All 20 decorative page/slide backgrounds, previewed per theme."
                  monogram="Bg"
                  href="/internal/backgrounds"
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
