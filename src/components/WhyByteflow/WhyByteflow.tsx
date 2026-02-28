import SectionLabel from '@/components/SectionLabel/SectionLabel';
import styles from './WhyByteflow.module.css';

export default function WhyByteflow() {
    return (
        <section className={styles.section} data-animate>
            <div className={styles.glow} />
            <div className={styles.container}>
                <div className={styles.header}>
                    <SectionLabel label="WHY BYTEFLOW" />
                    <h2 className={styles.title}>Built for Scale. Designed for Results.</h2>
                </div>

                <div className={styles.grid}>
                    <div className={styles.pillar}>
                        <div className={styles.icon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"></path>
                            </svg>
                        </div>
                        <h3 className={styles.pillarTitle}>Precision Engineering</h3>
                        <p className={styles.pillarDesc}>Clean architectures and robust codebases that stand the test of time.</p>
                    </div>

                    <div className={styles.pillar}>
                        <div className={styles.icon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                            </svg>
                        </div>
                        <h3 className={styles.pillarTitle}>Speed to Market</h3>
                        <p className={styles.pillarDesc}>Agile methodologies that deliver working software to users faster.</p>
                    </div>

                    <div className={styles.pillar}>
                        <div className={styles.icon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>
                        <h3 className={styles.pillarTitle}>Strategic Partnership</h3>
                        <p className={styles.pillarDesc}>We act as an extension of your own engineering and leadership teams.</p>
                    </div>

                    <div className={styles.pillar}>
                        <div className={styles.icon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>
                        <h3 className={styles.pillarTitle}>Enterprise Security</h3>
                        <p className={styles.pillarDesc}>Security-first development approach protecting your vital data assets.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
