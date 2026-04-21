import styles from './Hero.module.css';

const steps = [
  {
    num: '01',
    title: 'Discover',
    desc: 'Strategic architecture, technical scoping, and a written memo before any code is committed.',
  },
  {
    num: '02',
    title: 'Build',
    desc: 'Precision engineering shipped in weekly sprints, with senior partners on every review.',
  },
  {
    num: '03',
    title: 'Scale',
    desc: 'Cloud-native infrastructure, always-on support, and a partnership that grows with you.',
  },
];

export default function Hero() {
  return (
    <section className={styles.hero}>
      {/* Ambient blobs */}
      <div className={styles.blobWrap} aria-hidden>
        <div className={`${styles.blob} ${styles.blobOne}`} />
        <div className={`${styles.blob} ${styles.blobTwo}`} />
        <div className={`${styles.blob} ${styles.blobThree}`} />
      </div>

      <div className={styles.inner}>
        <div className={styles.eyebrowPill}>
          <span className={styles.sparkle}>✦</span>
          Enterprise software, delivered beautifully
        </div>

        <h1 className={styles.h1}>
          Building your solutions,{' '}
          <span className={styles.gradText}>Byte By Byte</span>
        </h1>

        <p className={styles.sub}>
          ByteFlow Solutions partners with ambitious teams to design, engineer,
          and scale the products that matter — from first architectural sketch
          to production deployment.
        </p>

        <div className={styles.actions}>
          <a href="/contact" className={styles.btnPrimary}>
            Start a project
            <span className={styles.arrow} aria-hidden>→</span>
          </a>
          <a href="/work" className={styles.btnGhost}>
            See our work
          </a>
        </div>

        {/* Showcase: The ByteFlow Way */}
        <div className={styles.showcase}>
          <div className={styles.showcaseInner}>
            <div className={styles.showcaseHead}>
              <span className={styles.eyebrow}>THE BYTEFLOW WAY</span>
              <span className={styles.showcaseSub}>A three-phase engagement</span>
            </div>

            <h2 className={styles.showcaseTitle}>
              From <span className={styles.gradText}>first byte</span> to full
              deployment — we architect every layer.
            </h2>

            <div className={styles.steps}>
              {steps.map((step, i) => (
                <div key={step.num} className={styles.step}>
                  <div className={styles.stepHead}>
                    <div className={`${styles.stepTile} ${styles[`tile${i}`]}`} />
                    <div>
                      <div className={styles.stepNum}>{step.num}</div>
                      <h3 className={styles.stepTitle}>{step.title}</h3>
                    </div>
                  </div>
                  <p className={styles.stepDesc}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
