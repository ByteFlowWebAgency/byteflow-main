import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import styles from './Services.module.css';

const services = [
  {
    title: 'Enterprise Software',
    desc: 'Platforms, internal tools, and mission-critical systems built to the standards your CTO actually wants.',
  },
  {
    title: 'Custom Development',
    desc: 'Bespoke web and mobile applications, designed for the workflow you have — not the one the template assumes.',
  },
  {
    title: 'AI Integration',
    desc: 'Practical LLM tooling, retrieval pipelines, and agent workflows that ship, measured, maintained, and owned by your team.',
  },
  {
    title: 'Cloud Solutions',
    desc: 'AWS and GCP architecture with sensible defaults, cost discipline, and migration paths that do not break production.',
  },
  {
    title: 'SEO & Digital Growth',
    desc: 'Technical SEO, Core Web Vitals, and content infrastructure that compounds instead of decaying on the next algorithm update.',
  },
  {
    title: 'Consulting',
    desc: 'Fractional senior engineering and architecture reviews for teams that need a steadier hand at the wheel.',
  },
];

export default function Services() {
  return (
    <section className={styles.services} id="services">
      <div className={styles.inner}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>WHAT WE DO</p>
            <h2 className={styles.h2}>
              End-to-end capabilities,{' '}
              <span className={styles.gradText}>delivered with care.</span>
            </h2>
          </div>
          <p className={styles.lede}>
            Six integrated practices, one senior team. We build the things
            other agencies sub-contract.
          </p>
        </div>

        <div className={styles.grid}>
          {services.map((svc, i) => (
            <ScrollReveal key={svc.title} delay={i * 60}>
              <div className={styles.card}>
                <div className={`${styles.tile} ${styles[`tile${i}`]}`} aria-hidden />
                <h3 className={styles.cardTitle}>{svc.title}</h3>
                <p className={styles.cardDesc}>{svc.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
