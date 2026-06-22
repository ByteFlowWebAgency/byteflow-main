import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import styles from './Why.module.css';
import type { CardData } from '@/lib/contentful/props';

interface WhyProps {
  eyebrow: string;
  heading: string;
  values: CardData[];
}

export default function Why({ eyebrow, heading, values }: WhyProps) {
  return (
    <section className={styles.why} id="why">
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h2 className={styles.h2}>{heading}</h2>
        </div>

        <div className={styles.grid}>
          {values.map((value, i) => (
            <ScrollReveal key={value.title} delay={i * 60}>
              <div className={styles.card}>
                <div className={`${styles.tile} ${styles[`tile${i}`]}`} aria-hidden />
                <h3 className={styles.cardTitle}>{value.title}</h3>
                <p className={styles.cardDesc}>{value.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
