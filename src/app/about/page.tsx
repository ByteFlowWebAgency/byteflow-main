import type { Metadata } from 'next';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import styles from './page.module.css';
import { getPage } from '@/lib/contentful/queries';
import { cardsOf, ctaFrom, headerOf, sectionsOf } from '@/lib/contentful/extract';
import { linkAttrs } from '@/lib/contentful/props';

export const metadata: Metadata = {
  title: 'About · ByteFlow Solutions',
  description:
    'ByteFlow Solutions — senior engineering partners who embed with your team from first sketch to production.',
};

export default async function AboutPage() {
  const page = await getPage('about');
  const sections = sectionsOf(page);

  const hero = headerOf(sections[0]);
  const story = headerOf(sections[1]);
  const approachHeader = headerOf(sections[2]);
  const valuesHeader = headerOf(sections[3]);
  const cta = headerOf(sections[4]);
  const primaryCta = ctaFrom(cta?.primaryCta);
  const secondaryCta = ctaFrom(cta?.secondaryCta);

  const storyParagraphs = (story?.subText ?? '').split('\n\n').filter(Boolean);

  const approach = cardsOf(sections[2]).map((c) => ({
    num: c.eyebrow ?? '',
    title: c.title ?? '',
    desc: c.description ?? '',
  }));
  const values = cardsOf(sections[3]).map((c) => ({
    title: c.title ?? '',
    desc: c.description ?? '',
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

      <section className={styles.story}>
        <div className={styles.inner}>
          <ScrollReveal>
            <div className={styles.storyGrid}>
              <div>
                <p className={styles.eyebrow}>{story?.eyebrow}</p>
                <h2 className={styles.sectionH2}>{story?.heading}</h2>
              </div>
              <div className={styles.storyRight}>
                {storyParagraphs.map((para, i) => (
                  <p key={i} className={styles.body}>{para}</p>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className={styles.approach}>
        <div className={styles.inner}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>{approachHeader?.eyebrow}</p>
            <h2 className={styles.sectionH2}>{approachHeader?.heading}</h2>
          </div>

          <div className={styles.approachGrid}>
            {approach.map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 80}>
                <div className={styles.approachCard}>
                  <div className={`${styles.tile} ${styles[`tile${i}`]}`} aria-hidden />
                  <span className={styles.stepNum}>{step.num}</span>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDesc}>{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.values}>
        <div className={styles.inner}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>{valuesHeader?.eyebrow}</p>
            <h2 className={styles.sectionH2}>{valuesHeader?.heading}</h2>
          </div>

          <div className={styles.valuesGrid}>
            {values.map((v, i) => (
              <ScrollReveal key={v.title} delay={i * 60}>
                <div className={styles.valueCard}>
                  <div className={`${styles.tile} ${styles[`vtile${i % 6}`]}`} aria-hidden />
                  <h3 className={styles.valueTitle}>{v.title}</h3>
                  <p className={styles.valueDesc}>{v.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
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
