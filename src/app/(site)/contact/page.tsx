import type { Metadata } from 'next';
import ContactForm from '@/components/ContactForm/ContactForm';
import styles from './page.module.css';
import { getPage } from '@/lib/contentful/queries';
import { cardsOf, headerOf, sectionsOf } from '@/lib/contentful/extract';

export const metadata: Metadata = {
  title: 'Contact · ByteFlow Solutions',
  description:
    'Get in touch with ByteFlow — schedule a consultation or reach out directly to discuss your technology needs.',
};

export default async function ContactPage() {
  const page = await getPage('contact');
  const sections = sectionsOf(page);

  const header = headerOf(sections[0]);
  const info = cardsOf(sections[0]).map((c) => ({
    label: c.eyebrow ?? '',
    value: c.tagline ?? '',
  }));

  return (
    <section className={styles.page}>
      <div className={styles.blobWrap} aria-hidden>
        <div className={`${styles.blob} ${styles.blobOne}`} />
        <div className={`${styles.blob} ${styles.blobTwo}`} />
      </div>

      <div className={styles.grid}>
        <div className={styles.textCol}>
          <p className={styles.eyebrow}>{header?.eyebrow}</p>
          <h1 className={styles.h1}>{header?.heading}</h1>
          <p className={styles.sub}>{header?.subText}</p>

          <div className={styles.infoList}>
            {info.map((item) => (
              <div key={item.label} className={styles.infoBlock}>
                <span className={styles.infoLabel}>{item.label}</span>
                {item.value.includes('@') ? (
                  <a href={`mailto:${item.value}`} className={styles.infoLink}>
                    {item.value}
                  </a>
                ) : (
                  <span className={styles.infoText}>{item.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.formCol}>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
