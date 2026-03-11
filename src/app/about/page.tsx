import type { Metadata } from 'next';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'About',
  description: 'BYTEFLOW — architects of the digital enterprise. Our story, values, and approach to engineering.',
};

const values = [
  {
    title: 'Precision Engineering',
    desc: 'Clean architectures and robust codebases that stand the test of time. Quality is never negotiated.',
  },
  {
    title: 'Speed to Market',
    desc: 'Agile methodologies that deliver working software to users faster — without cutting corners.',
  },
  {
    title: 'Strategic Partnership',
    desc: 'We act as an extension of your engineering and leadership teams, not just a vendor.',
  },
  {
    title: 'Enterprise Security',
    desc: 'Security-first development protecting your vital data assets at every layer of the stack.',
  },
  {
    title: 'Pragmatic Innovation',
    desc: 'We use cutting-edge technology when it provides competitive advantage — not for novelty.',
  },
  {
    title: 'Radical Transparency',
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
        <div className={styles.heroGrid} />
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <p className={styles.eyebrow}>Our Story</p>
        <h1 className={styles.h1}>
          Architects of the<br />
          <span className={styles.gradText}>Digital Enterprise.</span>
        </h1>
        <p className={styles.sub}>
          Founded on the principle that exceptional engineering shouldn&apos;t be constrained by legacy thinking or bureaucratic friction.
        </p>
      </section>

      <section className={styles.story}>
        <ScrollReveal>
          <div className={styles.storyGrid}>
            <div className={styles.storyLeft}>
              <p className={styles.eyebrow}>The BYTEFLOW Approach</p>
              <h2 className={styles.sectionH2}>We bridge the gap between vision and execution.</h2>
            </div>
            <div className={styles.storyRight}>
              <p className={styles.bodyText}>
                We observed a critical gap in the technology consulting landscape: firms either offered high-level strategic advice with no implementation capability, or provided low-cost development resources that lacked enterprise architectural vision.
              </p>
              <p className={styles.bodyText}>
                BYTEFLOW bridges that gap. We are a deep-tech engineering firm that embeds with our clients to solve their hardest technical challenges. Our teams don&apos;t just take orders — we challenge assumptions, design robust architectures, and deliver production code that scales.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <section className={styles.approachSection}>
        <div className={styles.approachHeader}>
          <p className={styles.eyebrow}>How We Work</p>
          <h2 className={styles.sectionH2}>Four stages. One outcome.</h2>
        </div>
        <div className={styles.approachGrid}>
          {approach.map((step, i) => (
            <ScrollReveal key={step.num} delay={i * 100}>
              <div className={styles.approachCard}>
                <span className={styles.approachNum}>{step.num}</span>
                <h3 className={styles.approachTitle}>{step.title}</h3>
                <p className={styles.approachDesc}>{step.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className={styles.valuesSection}>
        <div className={styles.valuesHeader}>
          <p className={styles.eyebrow}>Our Values</p>
          <h2 className={styles.sectionH2}>What drives every decision.</h2>
        </div>
        <div className={styles.valuesGrid}>
          {values.map((v, i) => (
            <ScrollReveal key={v.title} delay={i * 80}>
              <div className={styles.valueCard}>
                <h3 className={styles.valueTitle}>{v.title}</h3>
                <p className={styles.valueDesc}>{v.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className={styles.cta} id="contact">
        <div className={styles.ctaBg} />
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaH2}>
            Looking for a Strategic <span className={styles.gradText}>Technology Partner?</span>
          </h2>
          <p className={styles.ctaPara}>
            See how our engineering teams can help you overcome technical debt and scale your operations.
          </p>
          <a href="mailto:support@byteflowsolutions.com" className={styles.btnPrimary}>
            Get in Touch
          </a>
        </div>
      </section>
    </>
  );
}
