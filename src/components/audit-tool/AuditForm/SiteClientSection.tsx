'use client';

import styles from './AuditForm.module.css';
import type { AuditSectionProps } from './AuditForm';

export default function SiteClientSection({ audit, dispatch }: AuditSectionProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Site &amp; client</h2>
      <div className={styles.fieldGrid}>
        <div className={`${styles.field} ${styles.fieldWide}`}>
          <label htmlFor="au-site" className={`${styles.label} ${styles.required}`}>
            Site URL
          </label>
          <input
            id="au-site"
            className={styles.input}
            type="text"
            inputMode="url"
            value={audit.siteUrl}
            placeholder="example-client.com"
            onChange={(e) => dispatch({ type: 'set', patch: { siteUrl: e.target.value } })}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="au-client" className={`${styles.label} ${styles.required}`}>
            Client / organization
          </label>
          <input
            id="au-client"
            className={styles.input}
            type="text"
            value={audit.client.clientName}
            placeholder="Sample Nonprofit Org"
            onChange={(e) =>
              dispatch({ type: 'setClient', patch: { clientName: e.target.value } })
            }
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="au-contact" className={styles.label}>
            Contact name
          </label>
          <input
            id="au-contact"
            className={styles.input}
            type="text"
            value={audit.client.contactName}
            placeholder="Jane Doe"
            onChange={(e) =>
              dispatch({ type: 'setClient', patch: { contactName: e.target.value } })
            }
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="au-email" className={styles.label}>
            Contact email
          </label>
          <input
            id="au-email"
            className={styles.input}
            type="email"
            value={audit.client.contactEmail}
            placeholder="jane@example.org"
            onChange={(e) =>
              dispatch({ type: 'setClient', patch: { contactEmail: e.target.value } })
            }
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="au-date" className={styles.label}>
            Audit date
          </label>
          <input
            id="au-date"
            className={styles.input}
            type="date"
            value={audit.auditDate}
            onChange={(e) => dispatch({ type: 'set', patch: { auditDate: e.target.value } })}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="au-by" className={styles.label}>
            Audited by
          </label>
          <input
            id="au-by"
            className={styles.input}
            type="text"
            value={audit.auditedBy}
            onChange={(e) => dispatch({ type: 'set', patch: { auditedBy: e.target.value } })}
          />
        </div>
      </div>
    </section>
  );
}
