import styles from './InternalShell.module.css';

// Minimal internal footer — a quiet operational reminder, not a marketing footer.
export default function InternalFooter({ year }: { year: number }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <span className={styles.footerBrand}>ByteFlow Internal Tools</span>
        <span>
          Data lives in ByteFlow&apos;s Supabase project · periodic JSON backups
          recommended · © {year}
        </span>
      </div>
    </footer>
  );
}
