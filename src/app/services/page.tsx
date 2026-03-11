import type { Metadata } from 'next';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Services',
  description: 'End-to-end technology capabilities — enterprise software, AI integration, cloud solutions, custom development and more.',
};

const services = [
  {
    num: '01',
    title: 'Enterprise Software Solutions',
    sub: 'Architecting the Backbone of Your Business',
    body: 'We build scalable, custom enterprise platforms that unify your operations. Our team designs resilient architectures capable of handling massive data throughput, integrating seamlessly with your legacy systems, and providing a single source of truth across your organization.',
    features: ['Microservices Architecture', 'Legacy System Modernization', 'High-Volume Data Processing', 'API Ecosystems'],
  },
  {
    num: '02',
    title: 'Custom Development',
    sub: 'Bespoke Solutions for Unique Challenges',
    body: 'Off-the-shelf software forces you to compromise. We build custom applications tailored to your exact specifications — from complex internal dashboards to customer-facing platforms. Clean, performant, and secure code, delivered through an agile methodology.',
    features: ['Full-Stack Web Development', 'Progressive Web Apps', 'Internal Tooling', 'MVP Development'],
  },
  {
    num: '03',
    title: 'AI Integration',
    sub: 'Embedding Intelligence into Operations',
    body: 'We integrate cutting-edge AI and ML models directly into your existing workflows. Predictive analytics for supply chain optimization, NLP for automated customer support, or custom LLM deployment — we turn data into actionable intelligence.',
    features: ['LLM Integration (GPT, Claude)', 'Predictive Analytics', 'Computer Vision Systems', 'Process Automation'],
  },
  {
    num: '04',
    title: 'Cloud Solutions',
    sub: 'Resilient Infrastructure at Scale',
    body: 'We design, build, and deploy cloud environments on AWS, Azure, and GCP that prioritize high availability, robust security, and cost optimization. Infrastructure as code enables rapid deployments, automated scaling, and full disaster recovery.',
    features: ['Cloud Migration Strategy', 'Infrastructure as Code (Terraform)', 'Kubernetes Orchestration', 'Serverless Architectures'],
  },
  {
    num: '05',
    title: 'SEO & Digital Growth',
    sub: 'Data-Driven Visibility at Scale',
    body: 'Technical SEO, content architecture, and conversion optimization working in concert. We build organic visibility strategies grounded in data and tied directly to business outcomes — not vanity metrics.',
    features: ['Technical SEO Audits', 'Content Architecture', 'Core Web Vitals Optimization', 'Conversion Rate Strategy'],
  },
  {
    num: '06',
    title: 'Consulting & Host Management',
    sub: 'Strategic Advisory and Always-On Support',
    body: 'We act as strategic partners providing architectural reviews, technology stack audits, and technical debt reduction strategies. Our host management teams provide 24/7 monitoring, incident response, and continuous optimization.',
    features: ['Architecture Audits', 'CTO Advisory Services', '24/7 Monitoring & Alerting', 'Continuous Optimization'],
  },
];

export default function ServicesPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroGrid} />
        <div className={styles.orb} />
        <p className={styles.eyebrow}>Our Capabilities</p>
        <h1 className={styles.h1}>
          End-to-End Technology<br />
          <span className={styles.gradText}>Capabilities.</span>
        </h1>
        <p className={styles.sub}>
          Comprehensive engineering across the full modern tech stack — from resilient cloud infrastructure to intelligent data systems.
        </p>
      </section>

      <section className={styles.list}>
        {services.map((svc, i) => (
          <ScrollReveal key={svc.num} delay={i * 60}>
            <div className={styles.row}>
              <div className={styles.rowLeft}>
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
            </div>
          </ScrollReveal>
        ))}
      </section>

      <section className={styles.cta} id="contact">
        <div className={styles.ctaBg} />
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaH2}>
            Ready to Optimize <span className={styles.gradText}>Your Systems?</span>
          </h2>
          <p className={styles.ctaPara}>
            Contact our engineering team to discuss your architecture and see how we can help you scale.
          </p>
          <a href="mailto:support@byteflowsolutions.com" className={styles.btnPrimary}>
            Request a Consultation
          </a>
        </div>
      </section>
    </>
  );
}
