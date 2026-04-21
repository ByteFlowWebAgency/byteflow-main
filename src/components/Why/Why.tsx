import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import styles from './Why.module.css';

const values = [
  {
    title: 'Senior-only team',
    desc: 'No pyramid. The people who scope your project are the people who build it and the people who support it six months from now.',
  },
  {
    title: 'Written, not vibed',
    desc: 'Every engagement begins with a technical memo. Every sprint ends with one. Decisions live on paper, not in someone\u2019s head.',
  },
  {
    title: 'Cloud-native by default',
    desc: 'Infrastructure as code, zero-downtime deploys, and observability from day one — not bolted on at the enterprise readiness review.',
  },
  {
    title: 'Built to be handed over',
    desc: 'We document as we go and leave a codebase your team can own. A good engagement ends with us needed less, not more.',
  },
];

export default function Why() {
  return (
    <section className={styles.why} id="why">
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>WHY BYTEFLOW</p>
          <h2 className={styles.h2}>
            Senior partners, <span className={styles.gradText}>end-to-end</span>,
            on every engagement.
          </h2>
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
