import type { Metadata } from 'next';
import '@/components/internal-tools/tokens.css';
import HubTile from '@/components/internal-tools/HubTile';
import ChromeModeToggle from '@/components/internal-tools/ChromeModeToggle';
import styles from './hub.module.css';

export const metadata: Metadata = {
  title: 'Internal Tools · ByteFlow',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

// The /internal hub — the shared entry point to the gated tools. The app shell
// (header/footer) is provided by the (protected) layout; this page is the landing
// masthead plus the tool tiles, grouped by what the tool is *for*: the pipeline
// itself, the deliverables that go out, and the brand system those render with.
export default function InternalHubPage() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div className={styles.headerRow}>
            <h1 className={styles.heading}>Internal Tools</h1>
            <ChromeModeToggle />
          </div>
          <p className={styles.subhead}>
            Everything the ByteFlow team uses to run the pipeline and produce client
            documents — in one place.
          </p>
        </header>

        <section className={styles.section} aria-labelledby="section-pipeline">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle} id="section-pipeline">
              Pipeline
            </h2>
            <p className={styles.sectionHint}>Who we&rsquo;re talking to, and what it&rsquo;s worth.</p>
          </div>
          <div className={styles.grid}>
            <HubTile
              title="CRM"
              description="Contacts, organizations, and the deal pipeline — who was referred by whom, and what to do today."
              monogram="Cr"
              href="/internal/crm"
            />
            <HubTile
              title="Budgets"
              description="Planned vs. actual by category for project and recurring budgets. Planning only — books stay in QuickBooks."
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
            <p className={styles.sectionHint}>What goes out the door.</p>
          </div>
          <div className={styles.grid}>
            <HubTile
              title="Documents"
              description="Compose free-form, on-brand documents from typed blocks — proposals, one-pagers, audits, briefs, reports — with templates, themes, and PDF export."
              monogram="Dc"
              href="/internal/documents"
            />
            <HubTile
              title="Presentations"
              description="25 BYTEFLOW-branded slide templates — assemble a deck, edit inline, download a real, editable .pptx for proposal follow-ups and live calls."
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
            <p className={styles.sectionHint}>The shared look those deliverables render with.</p>
          </div>
          <div className={styles.grid}>
            <HubTile
              title="Document Themes"
              description="Create and manage the color and font themes documents render with — including dark covers for pitch decks."
              monogram="Th"
              href="/internal/theme-editor"
            />
            <HubTile
              title="Backgrounds"
              description="Browse all 20 built-in decorative page/slide backgrounds and preview how each recolors under any saved theme."
              monogram="Bg"
              href="/internal/backgrounds"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
