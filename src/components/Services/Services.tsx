import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import styles from './Services.module.css';
import type { CardData } from '@/lib/contentful/props';

interface ServicesProps {
  eyebrow: string;
  heading: string;
  lede: string;
  services: CardData[];
}

export default function Services({ eyebrow, heading, lede, services }: ServicesProps) {
  return (
    <section className={styles.services} id="services">
      <div className={styles.inner}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h2 className={styles.h2}>{heading}</h2>
          </div>
          <p className={styles.lede}>{lede}</p>
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
