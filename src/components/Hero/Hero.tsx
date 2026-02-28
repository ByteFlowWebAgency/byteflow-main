import Link from 'next/link';
import SectionLabel from '@/components/SectionLabel/SectionLabel';
import styles from './Hero.module.css';

export default function Hero() {
    return (
        <section className={styles.hero}>
            <div className={styles.glowBg}></div>
            <div className={styles.container}>
                <div className={styles.leftCol} data-animate>
                    <SectionLabel label="ENTERPRISE TECHNOLOGY SOLUTIONS" />
                    <h1 className={styles.title}>
                        Transforming Business. One <span className={styles.highlight}>Byte</span> at a Time.
                    </h1>
                    <div className={styles.divider}></div>
                </div>
                <div className={styles.rightCol} data-animate>
                    <h2 className={styles.subtitle}>Engineered for scale. Built for impact.</h2>
                    <p className={styles.body}>
                        BYTEFLOW partners with organizations to design, build, and deploy enterprise-grade technology — from AI integration to cloud infrastructure — with precision and speed.
                    </p>
                    <div className={styles.actions}>
                        <Link href="/services" className={styles.primaryBtn}>
                            Explore Our Services
                        </Link>
                        <Link href="/portfolio" className={styles.secondaryLink}>
                            View Our Work <span className={styles.arrow}>›</span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
