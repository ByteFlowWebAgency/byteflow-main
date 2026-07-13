import Link from 'next/link';
import styles from './HomeLink.module.css';

// "Back to home" for every internal tool's toolbar — one way back to the /internal hub
// from anywhere, always in the same place. (The marketing site home stays reachable
// through the site Nav above the tool chrome.)
export default function HomeLink() {
  return (
    <Link href="/internal" className={styles.homeLink}>
      ← Home
    </Link>
  );
}
