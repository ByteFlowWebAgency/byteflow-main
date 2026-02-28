'use client';

import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import SectionLabel from '@/components/SectionLabel/SectionLabel';
import ContactForm from '@/components/ContactForm/ContactForm';
import styles from './page.module.css';

export default function ContactPage() {
    useScrollAnimation();

    return (
        <>
            <section className={styles.hero}>
                <div className={styles.container}>
                    <div className={styles.grid}>
                        <div className={styles.textContent}>
                            <SectionLabel label="GET IN TOUCH" />
                            <h1 className={styles.title} data-animate>
                                Let&apos;s Build Something Exceptional.
                            </h1>
                            <p className={styles.subtitle} data-animate>
                                Whether you need to modernize legacy systems, integrate AI, or build a scalable cloud architecture from scratch, our engineering team is ready to help.
                            </p>

                            <div className={styles.infoBlock} data-animate>
                                <h3 className={styles.infoLabel}>Global Headquarters</h3>
                                <p className={styles.infoText}>
                                    100 Innovation Drive<br />
                                    Suite 400<br />
                                    San Francisco, CA 94105
                                </p>
                            </div>

                            <div className={styles.infoBlock} data-animate>
                                <h3 className={styles.infoLabel}>Direct Contact</h3>
                                <p className={styles.infoText}>
                                    <a href="mailto:partnerships@byteflowsolutions.com" className={styles.link}>
                                        partnerships@byteflowsolutions.com
                                    </a>
                                    <br />
                                    <a href="tel:+18005550198" className={styles.link}>
                                        +1 (800) 555-0198
                                    </a>
                                </p>
                            </div>
                        </div>

                        <div className={styles.formWrapper} data-animate>
                            <ContactForm />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
