import type { Metadata } from 'next';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import styles from './page.module.css';
import { getPage } from '@/lib/contentful/queries';
import { cardsOf, ctaFrom, headerOf, sectionsOf } from '@/lib/contentful/extract';
import { linkAttrs } from '@/lib/contentful/props';

export const metadata: Metadata = {
  title: 'Services · ByteFlow Solutions',
  description:
    'End-to-end technology capabilities — enterprise software, AI integration, cloud solutions, custom development and more.',
};

export default async function ServicesPage() {
  const page = await getPage('services');
  const sections = sectionsOf(page);

  const hero = headerOf(sections[0]);
  const cta = headerOf(sections[2]);
  const primaryCta = ctaFrom(cta?.primaryCta);
  const secondaryCta = ctaFrom(cta?.secondaryCta);

  const services = cardsOf(sections[1]).map((c) => ({
    num: c.eyebrow ?? '',
    title: c.title ?? '',
    sub: c.tagline ?? '',
    body: c.description ?? '',
    features: c.bullets ?? [],
  }));

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.blobWrap} aria-hidden>
          <div className={`${styles.blob} ${styles.blobOne}`} />
          <div className={`${styles.blob} ${styles.blobTwo}`} />
        </div>

        <div className={styles.inner}>
          <p className={styles.eyebrow}>{hero?.eyebrow}</p>
          <h1 className={styles.h1}>{hero?.heading}</h1>
          <p className={styles.sub}>{hero?.subText}</p>
        </div>
      </section>

      <section className={styles.list}>
        <div className={styles.inner}>
          {services.map((svc, i) => (
            <ScrollReveal key={svc.num} delay={i * 60}>
              <article className={styles.row}>
                <div className={styles.rowLeft}>
                  <div className={`${styles.tile} ${styles[`tile${i}`]}`} aria-hidden />
                  <span className={styles.rowNum}>{svc.num}</span>
                  <h2 className={styles.rowTitle}>{svc.title}</h2>
                  <p className={styles.rowSub}>{svc.sub}</p>
                </div>
                <div className={styles.rowRight}>
                  <p className={styles.rowBody}>{svc.body}</p>
                  <ul className={styles.featureList}>
                    {svc.features.map((f) => (
                      <li key={f} className={styles.featureItem}>
                        <span className={styles.featureDot} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaContainer}>
          <div className={styles.ctaOverlay} aria-hidden />
          <div className={styles.ctaContent}>
            <p className={styles.ctaEyebrow}>{cta?.eyebrow}</p>
            <h2 className={styles.ctaH2}>{cta?.heading}</h2>
            <p className={styles.ctaPara}>{cta?.subText}</p>
            <div className={styles.ctaActions}>
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
    </>
  );
}
