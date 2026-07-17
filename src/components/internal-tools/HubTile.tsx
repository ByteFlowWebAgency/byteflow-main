import Link from 'next/link';
import styles from './HubTile.module.css';

export interface HubTileProps {
  title: string;
  description: string;
  /** Two-letter monogram shown in the gradient icon tile, e.g. "Pr". */
  monogram: string;
  href: string;
}

/** One tool tile on the /internal hub. Every tile links to a working tool. */
export default function HubTile({ title, description, monogram, href }: HubTileProps) {
  return (
    <Link href={href} className={styles.tile}>
      <span className={styles.monogram} aria-hidden>
        {monogram}
      </span>
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        <span className={styles.description}>{description}</span>
      </span>
    </Link>
  );
}
