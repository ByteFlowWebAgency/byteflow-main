import styles from './Hero.module.css';
import { linkAttrs, type NavLinkData, type StepData } from '@/lib/contentful/props';

interface HeroProps {
  eyebrow: string;
  heading: string;
  subText: string;
  primaryCta?: NavLinkData;
  secondaryCta?: NavLinkData;
  showcaseEyebrow: string;
  showcaseTitle: string;
  steps: StepData[];
}

export default function Hero({
  eyebrow,
  heading,
  subText,
  primaryCta,
  secondaryCta,
  showcaseEyebrow,
  showcaseTitle,
  steps,
}: HeroProps) {
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
          {eyebrow}
        </div>

        <h1 className={styles.h1}>{heading}</h1>

        <p className={styles.sub}>{subText}</p>

        <div className={styles.actions}>
          {primaryCta && (
            <a {...linkAttrs(primaryCta)} className={styles.btnPrimary}>
              {primaryCta.label}
              <span className={styles.arrow} aria-hidden>→</span>
            </a>
          )}
          {secondaryCta && (
            <a {...linkAttrs(secondaryCta)} className={styles.btnGhost}>
              {secondaryCta.label}
            </a>
          )}
        </div>

        {/* Showcase: The ByteFlow Way */}
        <div className={styles.showcase}>
          <div className={styles.showcaseInner}>
            <div className={styles.showcaseHead}>
              <span className={styles.eyebrow}>{showcaseEyebrow}</span>
              <span className={styles.showcaseSub}>A three-phase engagement</span>
            </div>

            <h2 className={styles.showcaseTitle}>{showcaseTitle}</h2>

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
