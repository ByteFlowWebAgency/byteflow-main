import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Work',
  description: 'Enterprise case studies and portfolio — BYTEFLOW delivering measurable results across finance, healthcare, logistics and more.',
};

const projects = [
  {
    tag: 'Finance',
    title: 'Global Payments Platform',
    meta: '$100M+ processed in year one · 99.999% uptime',
    body: 'Architected a high-throughput payments infrastructure processing over 50,000 transactions per second with sub-10ms latency. Integrated fraud detection ML models that reduced chargebacks by 62%.',
    results: ['$100M+ processed year one', '99.999% uptime SLA', '62% chargeback reduction'],
    src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop',
  },
  {
    tag: 'Healthcare',
    title: 'AI Diagnostic Engine',
    meta: '40% reduction in screening time',
    body: 'Built a computer vision pipeline that analyzes medical imaging at scale. The system reduced radiologist workload by 40% while improving early detection accuracy by 28%.',
    results: ['40% faster screening', '28% detection accuracy gain', '3 hospital networks deployed'],
    src: 'https://images.unsplash.com/photo-1576091160550-2173ff9e5ee5?q=80&w=800&auto=format&fit=crop',
  },
  {
    tag: 'Logistics',
    title: 'Real-Time Supply Chain',
    meta: '$2.4M saved annually',
    body: 'Replaced a fragmented set of spreadsheets and legacy ERPs with a unified real-time supply chain platform. Predictive demand models cut overstock costs by 34%.',
    results: ['$2.4M annual savings', '34% overstock reduction', 'Real-time across 12 warehouses'],
    src: 'https://images.unsplash.com/photo-1586528116311-ad8ed7c80a30?q=80&w=800&auto=format&fit=crop',
  },
];

const stats = [
  { num: '$140M+', label: 'Client Revenue via Our Platforms' },
  { num: '99.999%', label: 'SLA Consistently Maintained' },
  { num: '40%', label: 'Avg Reduction in Operational Costs' },
];

export default function WorkPage() {
  notFound();
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroGrid} />
        <div className={styles.orb} />
        <p className={styles.eyebrow}>Case Studies</p>
        <h1 className={styles.h1}>
          Proven Engineering.<br />
          <span className={styles.gradText}>Measurable Impact.</span>
        </h1>
        <p className={styles.sub}>
          Select case studies demonstrating our ability to solve complex technical challenges at enterprise scale.
        </p>
      </section>

      <section className={styles.statsStrip}>
        {stats.map((s) => (
          <div key={s.label} className={styles.statItem}>
            <span className={styles.statNum}>{s.num}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </section>

      <section className={styles.projects}>
        {projects.map((p, i) => (
          <ScrollReveal key={p.title} delay={i * 80}>
            <div className={styles.projectCard}>
              <div className={styles.projectImgWrap}>
                <Image
                  src={p.src}
                  alt={p.title}
                  fill
                  className={styles.projectImg}
                  sizes="(max-width: 900px) 100vw, 50vw"
                />
                <div className={styles.projectImgOverlay} />
              </div>
              <div className={styles.projectContent}>
                <span className={styles.projectTag}>{p.tag}</span>
                <h2 className={styles.projectTitle}>{p.title}</h2>
                <p className={styles.projectMeta}>{p.meta}</p>
                <p className={styles.projectBody}>{p.body}</p>
                <ul className={styles.resultList}>
                  {p.results.map((r) => (
                    <li key={r} className={styles.resultItem}>
                      <span className={styles.resultDot} />
                      {r}
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
            Let&apos;s Build Your <span className={styles.gradText}>Success Story.</span>
          </h2>
          <p className={styles.ctaPara}>
            Bring us your hardest technical challenges. We&apos;ll bring the engineering talent to solve them.
          </p>
          <a href="mailto:support@byteflowsolutions.com" className={styles.btnPrimary}>
            Start the Conversation
          </a>
        </div>
      </section>
    </>
  );
}
