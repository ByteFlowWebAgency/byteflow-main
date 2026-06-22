import styles from './CtaBand.module.css';
import { linkAttrs, type NavLinkData } from '@/lib/contentful/props';

interface CtaBandProps {
  eyebrow: string;
  heading: string;
  lede: string;
  primaryCta?: NavLinkData;
  secondaryCta?: NavLinkData;
}

export default function CtaBand({
  eyebrow,
  heading,
  lede,
  primaryCta,
  secondaryCta,
}: CtaBandProps) {
  return (
    <section className={styles.ctaBand} id="contact">
      <div className={styles.container}>
        <div className={styles.overlay} aria-hidden />
        <div className={styles.content}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h2 className={styles.h2}>{heading}</h2>
          <p className={styles.lede}>{lede}</p>
          <div className={styles.actions}>
            {primaryCta && (
              <a {...linkAttrs(primaryCta)} className={styles.btnPrimary}>
                {primaryCta.label}
                <span className={styles.arrow} aria-hidden>→</span>
              </a>
            )}
            {secondaryCta && (
              <a {...linkAttrs(secondaryCta)} className={styles.btnGhost}>
                {secondaryCta.label}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
