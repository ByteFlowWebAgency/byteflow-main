import type { Metadata } from 'next';
import Image from 'next/image';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import styles from './page.module.css';
import { getPage } from '@/lib/contentful/queries';
import { cardsOf, ctaFrom, headerOf, sectionsOf } from '@/lib/contentful/extract';
import { assetUrl, linkAttrs } from '@/lib/contentful/props';

export const metadata: Metadata = {
  title: 'Work',
  description: 'Enterprise case studies and portfolio — BYTEFLOW delivering measurable results across finance, healthcare, logistics and more.',
};

export default async function WorkPage() {
  const page = await getPage('work');
  const sections = sectionsOf(page);

  const hero = headerOf(sections[0]);
  const cta = headerOf(sections[2]);
  const primaryCta = ctaFrom(cta?.primaryCta);

  const projects = cardsOf(sections[1]).map((c) => ({
    tag: c.eyebrow ?? '',
    title: c.companyName ?? '',
    meta: c.tagline ?? '',
    body: c.description ?? '',
    src: assetUrl(c.thumbnail),
    url: c.url,
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

      <section className={styles.projects}>
        <div className={styles.inner}>
          {projects.map((p, i) => (
            <ScrollReveal key={p.title} delay={i * 80}>
              <div className={styles.projectCard}>
                <div className={styles.projectImgWrap}>
                  {p.url ? (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.projectImgLink}
                      aria-label={`Visit ${p.title}`}
                    >
                      {p.src && (
                        <Image
                          src={p.src}
                          alt={p.title}
                          fill
                          className={styles.projectImg}
                          sizes="(max-width: 900px) 100vw, 50vw"
                        />
                      )}
                      <div className={styles.projectImgOverlay} />
                    </a>
                  ) : (
                    <>
                      {p.src && (
                        <Image
                          src={p.src}
                          alt={p.title}
                          fill
                          className={styles.projectImg}
                          sizes="(max-width: 900px) 100vw, 50vw"
                        />
                      )}
                      <div className={styles.projectImgOverlay} />
                    </>
                  )}
                </div>
                <div className={styles.projectContent}>
                  <span className={styles.projectTag}>{p.tag}</span>
                  <h2 className={styles.projectTitle}>{p.title}</h2>
                  <p className={styles.projectMeta}>{p.meta}</p>
                  <p className={styles.projectBody}>{p.body}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className={styles.cta} id="contact">
        <div className={styles.ctaContainer}>
          <div className={styles.ctaOverlay} aria-hidden />
          <div className={styles.ctaContent}>
            <p className={styles.ctaEyebrow}>{cta?.eyebrow}</p>
            <h2 className={styles.ctaH2}>{cta?.heading}</h2>
            <p className={styles.ctaPara}>{cta?.subText}</p>
            {primaryCta && (
              <a {...linkAttrs(primaryCta)} className={styles.btnPrimary}>
                {primaryCta.label}
                <span className={styles.arrow} aria-hidden>→</span>
              </a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
