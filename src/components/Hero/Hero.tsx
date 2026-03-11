import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section className={styles.hero}>
      {/* Background layers */}
      <div className={styles.heroGrid} />
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      {/* Content */}
      <p className={styles.heroEyebrow}>Enterprise Technology Solutions</p>

      <h1 className={styles.heroH1}>
        Transforming<br />
        <span className={styles.gradWord}>Business.</span><br />
        One Byte at a Time.
      </h1>

      <p className={styles.heroSub}>
        BYTEFLOW partners with organizations to design, build, and deploy enterprise-grade technology — from AI integration to cloud infrastructure — with precision and speed.
      </p>

      <div className={styles.heroActions}>
        <a href="#services" className={styles.btnPrimary}>Our Services</a>
        <a href="#contact" className={styles.btnGhost}>Schedule a Call</a>
      </div>

      {/* Stats */}
      <div className={styles.heroStats}>
        <div className={styles.statItem}>
          <span className={styles.statNum}>150+</span>
          <span className={styles.statLabel}>Projects Delivered</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNum}>98%</span>
          <span className={styles.statLabel}>Client Retention Rate</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNum}>7</span>
          <span className={styles.statLabel}>Core Capabilities</span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className={styles.heroScroll}>Scroll</div>
    </section>
  );
}
