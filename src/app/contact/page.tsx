import type { Metadata } from 'next';
import ContactForm from '@/components/ContactForm/ContactForm';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with BYTEFLOW — schedule a consultation or reach out directly to discuss your technology needs.',
};

export default function ContactPage() {
  return (
    <section className={styles.page}>
      <div className={styles.heroGrid} />
      <div className={styles.orb} />

      <div className={styles.grid}>
        <div className={styles.textCol}>
          <p className={styles.eyebrow}>Get in Touch</p>
          <h1 className={styles.h1}>
            Let&apos;s Build Something <span className={styles.gradText}>Exceptional.</span>
          </h1>
          <p className={styles.sub}>
            Whether you need to modernize legacy systems, integrate AI, or build a scalable cloud architecture from scratch — our engineering team is ready to help.
          </p>

          <div className={styles.infoBlock}>
            <span className={styles.infoLabel}>Email</span>
            <a href="mailto:support@byteflowsolutions.com" className={styles.infoLink}>
              support@byteflowsolutions.com
            </a>
          </div>

          <div className={styles.infoBlock}>
            <span className={styles.infoLabel}>Services</span>
            <span className={styles.infoText}>
              Enterprise Software · AI Integration<br />
              Cloud Solutions · Consulting
            </span>
          </div>

          <div className={styles.infoBlock}>
            <span className={styles.infoLabel}>Response time</span>
            <span className={styles.infoText}>Within 1 business day</span>
          </div>
        </div>

        <div className={styles.formCol}>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
