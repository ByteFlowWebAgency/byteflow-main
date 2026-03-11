import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import styles from './Services.module.css';

const services = [
  {
    num: '01',
    title: 'Enterprise Software Solutions',
    desc: 'Scalable systems that unify operations and eliminate friction across your organization.',
  },
  {
    num: '02',
    title: 'Custom Development',
    desc: 'Bespoke platforms built to your exact specifications — from MVP to full-scale production.',
  },
  {
    num: '03',
    title: 'AI Integration',
    desc: 'Intelligent systems embedded into your workflows — from predictive models to LLM-powered automation.',
  },
  {
    num: '04',
    title: 'Cloud Solutions',
    desc: 'Resilient, cost-optimized infrastructure on AWS, Azure, and GCP built for your scale.',
  },
  {
    num: '05',
    title: 'SEO & Digital Growth',
    desc: 'Data-driven visibility strategies that convert organic traffic into measurable business outcomes.',
  },
  {
    num: '06',
    title: 'Consulting & Host Mgmt.',
    desc: 'Strategic advisory and always-on infrastructure management — so you never have to worry.',
  },
];

const icons = [
  // 01 Enterprise Software
  <svg key="1" className={styles.serviceIcon} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b3bbf"/>
        <stop offset=".5" stopColor="#7b4fd4"/>
        <stop offset="1" stopColor="#00d4e8"/>
      </linearGradient>
    </defs>
    <rect x="4" y="4" width="32" height="24" rx="2" stroke="url(#g1)" strokeWidth="1.5"/>
    <path d="M12 36h16M20 28v8" stroke="url(#g1)" strokeWidth="1.5"/>
    <path d="M10 14l4 4-4 4M18 22h8" stroke="url(#g1)" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>,
  // 02 Custom Development
  <svg key="2" className={styles.serviceIcon} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g2" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b3bbf"/>
        <stop offset=".5" stopColor="#7b4fd4"/>
        <stop offset="1" stopColor="#00d4e8"/>
      </linearGradient>
    </defs>
    <path d="M14 12L6 20l8 8M26 12l8 8-8 8M22 8l-4 24" stroke="url(#g2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
  // 03 AI Integration
  <svg key="3" className={styles.serviceIcon} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g3" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b3bbf"/>
        <stop offset=".5" stopColor="#7b4fd4"/>
        <stop offset="1" stopColor="#00d4e8"/>
      </linearGradient>
    </defs>
    <circle cx="20" cy="20" r="6" stroke="url(#g3)" strokeWidth="1.5"/>
    <path d="M20 4v6M20 30v6M4 20h6M30 20h6M8.69 8.69l4.24 4.24M27.07 27.07l4.24 4.24M31.31 8.69l-4.24 4.24M12.93 27.07l-4.24 4.24" stroke="url(#g3)" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>,
  // 04 Cloud Solutions
  <svg key="4" className={styles.serviceIcon} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g4" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b3bbf"/>
        <stop offset=".5" stopColor="#7b4fd4"/>
        <stop offset="1" stopColor="#00d4e8"/>
      </linearGradient>
    </defs>
    <path d="M10 28a8 8 0 010-16 8 8 0 0115.2-3.6A7 7 0 1130 28H10z" stroke="url(#g4)" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>,
  // 05 SEO & Digital Growth
  <svg key="5" className={styles.serviceIcon} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g5" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b3bbf"/>
        <stop offset=".5" stopColor="#7b4fd4"/>
        <stop offset="1" stopColor="#00d4e8"/>
      </linearGradient>
    </defs>
    <polyline points="6,30 14,20 20,24 28,12 34,16" stroke="url(#g5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="28" cy="12" r="3" stroke="url(#g5)" strokeWidth="1.5"/>
  </svg>,
  // 06 Consulting
  <svg key="6" className={styles.serviceIcon} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g6" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b3bbf"/>
        <stop offset=".5" stopColor="#7b4fd4"/>
        <stop offset="1" stopColor="#00d4e8"/>
      </linearGradient>
    </defs>
    <circle cx="20" cy="14" r="6" stroke="url(#g6)" strokeWidth="1.5"/>
    <path d="M8 34c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="url(#g6)" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>,
];

const arrowSvg = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 10L10 2M10 2H4M10 2V8" stroke="#00d4e8" strokeWidth="1.2"/>
  </svg>
);

export default function Services() {
  return (
    <section className={styles.services} id="services">
      <div className={styles.servicesHeader}>
        <div>
          <p className={styles.sectionEyebrow}>What We Do</p>
          <h2 className={styles.sectionH2}>End-to-End Technology Capabilities</h2>
        </div>
        <p className={styles.servicesHeaderRight}>
          We build robust, scalable solutions tailored to complex business challenges — byte by byte.
        </p>
      </div>

      <div className={styles.servicesGrid}>
        {services.map((svc, i) => (
          <ScrollReveal key={svc.num} delay={i * 100}>
            <div className={styles.serviceCard}>
              <span className={styles.serviceNum}>{svc.num}</span>
              {icons[i]}
              <h3 className={styles.serviceTitle}>{svc.title}</h3>
              <p className={styles.serviceDesc}>{svc.desc}</p>
              <div className={styles.serviceArrow}>{arrowSvg}</div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
