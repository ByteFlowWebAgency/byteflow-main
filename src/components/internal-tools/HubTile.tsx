import Link from 'next/link';
import styles from './HubTile.module.css';

export interface HubTileProps {
  title: string;
  description: string;
  /** Two-letter monogram shown in the gradient icon tile, e.g. "Pr". */
  monogram: string;
  /** Required when status is "live"; ignored for coming-soon tiles. */
  href?: string;
  status: 'live' | 'coming-soon';
}

/**
 * One tool tile on the /internal hub. Live tiles are links; coming-soon tiles are
 * deliberately non-interactive (no dead links, dimmed, labeled) per the hub spec.
 */
export default function HubTile({ title, description, monogram, href, status }: HubTileProps) {
  const body = (
    <>
      <span className={styles.monogram} aria-hidden>
        {monogram}
      </span>
      <span className={styles.text}>
        <span className={styles.title}>
          {title}
          {status === 'coming-soon' && <span className={styles.badge}>Coming soon</span>}
        </span>
        <span className={styles.description}>{description}</span>
      </span>
    </>
  );

  if (status === 'live' && href) {
    return (
      <Link href={href} className={styles.tile}>
        {body}
      </Link>
    );
  }
  return <div className={`${styles.tile} ${styles.tileDisabled}`}>{body}</div>;
}
