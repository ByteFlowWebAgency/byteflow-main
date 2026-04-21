import type { Metadata } from 'next';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'About · ByteFlow Solutions',
  description:
    'ByteFlow Solutions — senior engineering partners who embed with your team from first sketch to production.',
};

const values = [
  {
    title: 'Precision engineering',
    desc: 'Clean architectures and robust codebases that stand the test of time. Quality is never negotiated.',
  },
  {
    title: 'Speed to market',
    desc: 'Agile methodologies that deliver working software to users faster — without cutting corners.',
  },
  {
    title: 'Strategic partnership',
    desc: 'We act as an extension of your engineering and leadership teams, not just a vendor.',
  },
  {
    title: 'Enterprise security',
    desc: 'Security-first development protecting your vital data assets at every layer of the stack.',
  },
  {
    title: 'Pragmatic innovation',
    desc: 'We use cutting-edge technology when it provides competitive advantage — not for novelty.',
  },
  {
    title: 'Radical transparency',
    desc: 'Open communication about risks, progress, and challenges. No surprises — just solutions.',
  },
];

const approach = [
  {
    num: '01',
    title: 'Embed',
    desc: 'We join your team as senior engineering partners, learning your domain and constraints before writing a single line of code.',
  },
  {
    num: '02',
    title: 'Architect',
    desc: 'We design robust, scalable systems that address root causes — not symptoms. Every decision is documented and defensible.',
  },
  {
    num: '03',
    title: 'Deliver',
    desc: 'We ship production-ready software in rapid iterations, maintaining transparency throughout the entire lifecycle.',
  },
  {
    num: '04',
    title: 'Optimize',
    desc: 'Post-launch, we monitor, measure, and continuously improve — ensuring your investment compounds over time.',
  },
];

export default function AboutPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.blobWrap} aria-hidden>
          <div className={`${styles.blob} ${styles.blobOne}`} />
          <div className={`${styles.blob} ${styles.blobTwo}`} />
        </div>

        <div className={styles.inner}>
          <p className={styles.eyebrow}>OUR STORY</p>
          <h1 className={styles.h1}>
            Architects of the{' '}
            <span className={styles.gradText}>digital enterprise.</span>
          </h1>
          <p className={styles.sub}>
            Founded on the principle that exceptional engineering shouldn&apos;t
            be constrained by legacy thinking or bureaucratic friction.
          </p>
        </div>
      </section>

      <section className={styles.story}>
        <div className={styles.inner}>
          <ScrollReveal>
            <div className={styles.storyGrid}>
              <div>
                <p className={styles.eyebrow}>THE BYTEFLOW APPROACH</p>
                <h2 className={styles.sectionH2}>
                  We bridge the gap between{' '}
                  <span className={styles.gradText}>vision and execution.</span>
                </h2>
              </div>
              <div className={styles.storyRight}>
                <p className={styles.body}>
                  We observed a critical gap in the technology consulting
                  landscape: firms either offered high-level strategic advice
                  with no implementation capability, or provided low-cost
                  development resources that lacked enterprise architectural
                  vision.
                </p>
                <p className={styles.body}>
                  ByteFlow bridges that gap. We are a deep-tech engineering
                  firm that embeds with our clients to solve their hardest
                  technical challenges. Our teams don&apos;t just take orders —
                  we challenge assumptions, design robust architectures, and
                  deliver production code that scales.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className={styles.approach}>
        <div className={styles.inner}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>HOW WE WORK</p>
            <h2 className={styles.sectionH2}>
              Four stages. <span className={styles.gradText}>One outcome.</span>
            </h2>
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
            <p className={styles.eyebrow}>OUR VALUES</p>
            <h2 className={styles.sectionH2}>
              What drives <span className={styles.gradText}>every decision.</span>
            </h2>
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
            <p className={styles.ctaEyebrow}>READY TO SHIP</p>
            <h2 className={styles.ctaH2}>
              Looking for a strategic{' '}
              <span className={styles.gradText}>technology partner?</span>
            </h2>
            <p className={styles.ctaPara}>
              See how our engineering teams can help you overcome technical
              debt and scale your operations.
            </p>
            <div className={styles.ctaActions}>
              <a href="/contact" className={styles.btnPrimary}>
                Get in touch
                <span className={styles.arrow} aria-hidden>→</span>
              </a>
              <a href="/work" className={styles.btnGhost}>
                See our work
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
