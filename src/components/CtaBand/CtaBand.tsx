import styles from './CtaBand.module.css';

export default function CtaBand() {
  return (
    <section className={styles.ctaBand} id="contact">
      <div className={styles.ctaBandBg} />
      <div className={styles.ctaBandContent}>
        <h2 className={styles.ctaH2}>
          Ready to Build <span className={styles.gradText}>Something?</span>
        </h2>
        <p className={styles.ctaPara}>
          Let&apos;s discuss how BYTEFLOW can accelerate your digital transformation and build technology that scales with your business.
        </p>
        <a href="mailto:support@byteflowsolutions.com" className={styles.btnPrimary}>
          Schedule a Consultation
        </a>
      </div>
    </section>
  );
}
