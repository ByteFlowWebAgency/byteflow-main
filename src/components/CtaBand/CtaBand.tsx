import styles from './CtaBand.module.css';

export default function CtaBand() {
  return (
    <section className={styles.ctaBand} id="contact">
      <div className={styles.container}>
        <div className={styles.overlay} aria-hidden />
        <div className={styles.content}>
          <p className={styles.eyebrow}>READY TO SHIP</p>
          <h2 className={styles.h2}>
            Let&apos;s build something{' '}
            <span className={styles.gradText}>worth shipping.</span>
          </h2>
          <p className={styles.lede}>
            Tell us what you&apos;re working on. We&apos;ll come back within
            one business day with a named partner and a path forward.
          </p>
          <div className={styles.actions}>
            <a href="/contact" className={styles.btnPrimary}>
              Start a project
              <span className={styles.arrow} aria-hidden>→</span>
            </a>
            <a href="mailto:support@byteflowsolutions.com" className={styles.btnGhost}>
              Book a 30-min intro
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
