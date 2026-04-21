import type { Metadata } from 'next';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Services · ByteFlow Solutions',
  description:
    'End-to-end technology capabilities — enterprise software, AI integration, cloud solutions, custom development and more.',
};

const services = [
  {
    num: '01',
    title: 'Enterprise Software Solutions',
    sub: 'Architecting the backbone of your business',
    body: 'We build scalable, custom enterprise platforms that unify your operations. Our team designs resilient architectures capable of handling massive data throughput, integrating seamlessly with your legacy systems, and providing a single source of truth across your organization.',
    features: [
      'Microservices Architecture',
      'Legacy System Modernization',
      'High-Volume Data Processing',
      'API Ecosystems',
    ],
  },
  {
    num: '02',
    title: 'Custom Development',
    sub: 'Bespoke solutions for unique challenges',
    body: 'Off-the-shelf software forces you to compromise. We build custom applications tailored to your exact specifications — from complex internal dashboards to customer-facing platforms. Clean, performant, and secure code, delivered through an agile methodology.',
    features: [
      'Full-Stack Web Development',
      'Progressive Web Apps',
      'Internal Tooling',
      'MVP Development',
    ],
  },
  {
    num: '03',
    title: 'AI Integration',
    sub: 'Embedding intelligence into operations',
    body: 'We integrate cutting-edge AI and ML models directly into your existing workflows. Predictive analytics for supply chain optimization, NLP for automated customer support, or custom LLM deployment — we turn data into actionable intelligence.',
    features: [
      'LLM Integration (GPT, Claude)',
      'Predictive Analytics',
      'Computer Vision Systems',
      'Process Automation',
    ],
  },
  {
    num: '04',
    title: 'Cloud Solutions',
    sub: 'Resilient infrastructure at scale',
    body: 'We design, build, and deploy cloud environments on AWS, Azure, and GCP that prioritize high availability, robust security, and cost optimization. Infrastructure as code enables rapid deployments, automated scaling, and full disaster recovery.',
    features: [
      'Cloud Migration Strategy',
      'Infrastructure as Code (Terraform)',
      'Kubernetes Orchestration',
      'Serverless Architectures',
    ],
  },
  {
    num: '05',
    title: 'SEO & Digital Growth',
    sub: 'Data-driven visibility at scale',
    body: 'Technical SEO, content architecture, and conversion optimization working in concert. We build organic visibility strategies grounded in data and tied directly to business outcomes — not vanity metrics.',
    features: [
      'Technical SEO Audits',
      'Content Architecture',
      'Core Web Vitals Optimization',
      'Conversion Rate Strategy',
    ],
  },
  {
    num: '06',
    title: 'Consulting & Host Management',
    sub: 'Strategic advisory and always-on support',
    body: 'We act as strategic partners providing architectural reviews, technology stack audits, and technical debt reduction strategies. Our host management teams provide 24/7 monitoring, incident response, and continuous optimization.',
    features: [
      'Architecture Audits',
      'CTO Advisory Services',
      '24/7 Monitoring & Alerting',
      'Continuous Optimization',
    ],
  },
];

export default function ServicesPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.blobWrap} aria-hidden>
          <div className={`${styles.blob} ${styles.blobOne}`} />
          <div className={`${styles.blob} ${styles.blobTwo}`} />
        </div>

        <div className={styles.inner}>
          <p className={styles.eyebrow}>OUR CAPABILITIES</p>
          <h1 className={styles.h1}>
            End-to-end technology{' '}
            <span className={styles.gradText}>capabilities.</span>
          </h1>
          <p className={styles.sub}>
            Comprehensive engineering across the full modern tech stack — from
            resilient cloud infrastructure to intelligent data systems.
          </p>
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
            <p className={styles.ctaEyebrow}>READY TO SHIP</p>
            <h2 className={styles.ctaH2}>
              Ready to optimize{' '}
              <span className={styles.gradText}>your systems?</span>
            </h2>
            <p className={styles.ctaPara}>
              Contact our engineering team to discuss your architecture and see
              how we can help you scale.
            </p>
            <div className={styles.ctaActions}>
              <a href="/contact" className={styles.btnPrimary}>
                Request a consultation
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
