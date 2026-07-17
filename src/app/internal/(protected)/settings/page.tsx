import type { Metadata } from 'next';
import '@/components/internal-tools/tokens.css';
import CalendarConnection from '@/components/internal-tools/calendar/CalendarConnection';
import styles from './settings.module.css';

export const metadata: Metadata = {
  title: 'Settings · Internal Tools · ByteFlow',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

// Account-level settings: the things you set once and then forget about. The Google
// Calendar grant is the first of them, and the reason this page exists — connecting is a
// one-off, so the card was permanent furniture on a hub whose whole job is the calendar
// itself. It lives here now, reachable from the header whenever it needs reconnecting.
//
// This is also where /api/google/callback lands, with ?calendar=<reason>, so the outcome
// of a connect attempt is reported next to the control that started it.
export default async function InternalSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ calendar?: string }>;
}) {
  const { calendar } = await searchParams;

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1 className={styles.heading}>Settings</h1>
          <p className={styles.hint}>Connected accounts and integrations.</p>
        </header>

        <section className={styles.section} aria-labelledby="section-connections">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle} id="section-connections">
              Connections
            </h2>
          </div>
          <CalendarConnection status={calendar} />
        </section>
      </div>
    </main>
  );
}
