import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';
import type { FooterColumnData, LogoData } from '@/lib/contentful/props';

interface FooterProps {
  logo: LogoData | null;
  tagline: string;
  columns: FooterColumnData[];
  copyrightText: string;
}

export default function Footer({ logo, tagline, columns, copyrightText }: FooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>
              <Image
                src={logo?.url ?? '/BYTEFLOW_LOGO.png'}
                alt={logo?.alt ?? 'ByteFlow'}
                width={logo?.width ?? 320}
                height={logo?.height ?? 64}
                className={styles.logoImg}
              />
            </Link>
            <p className={styles.tagline}>{tagline}</p>
          </div>

          {columns.map((col) => (
            <div key={col.title} className={styles.col}>
              <h4 className={styles.colHeader}>{col.title}</h4>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.url} className={styles.link}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.bottom}>
          <span className={styles.copyLeft}>{copyrightText}</span>
        </div>
      </div>
    </footer>
  );
}
