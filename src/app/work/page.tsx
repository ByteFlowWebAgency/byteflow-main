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
    tag: 'Education',
    title: 'ClutchDNA',
    meta: 'S.E.L Curriculum platform',
    body: 'Architected a full-stack application for the ClutchDNA S.E.L Curriculum platform. Kitted with payment infrastructure and user/organization onboarding to lesson plans',
    results: ['$5,000 in revenue generated', '99.999% uptime SLA', '3 organizations onboarded'],
    src: '/Work/ClutchDNA.png',
    url: 'https://clutchdna.com',
  },
  {
    tag: 'Service',
    title: 'Buckeye Bin Cleaning',
    meta: '100% automated bin cleaning service bookings',
    body: 'Full-stack application for the Buckeye Bin Cleaning service in Northeast Ohio. Kitted with payment infrastructure and client booking with Geofencing radius checking based on address',
    results: ['100% automated bin cleaning service bookings', 'Payment processing', 'Geofencing radius checking based on address'],
    src: '/Work/BuckeyeBinCleaning.png',
    url: 'https://buckeyebincleaning.com',
  },
];

export default function WorkPage() {
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

      <section className={styles.projects}>
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
                    <Image
                      src={p.src}
                      alt={p.title}
                      fill
                      className={styles.projectImg}
                      sizes="(max-width: 900px) 100vw, 50vw"
                    />
                    <div className={styles.projectImgOverlay} />
                  </a>
                ) : (
                  <>
                    <Image
                      src={p.src}
                      alt={p.title}
                      fill
                      className={styles.projectImg}
                      sizes="(max-width: 900px) 100vw, 50vw"
                    />
                    <div className={styles.projectImgOverlay} />
                  </>
                )}
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
