'use client';

import styles from './ProposalForm.module.css';
import type { SectionProps } from './ProposalForm';

export default function ClientInfoSection({ proposal, dispatch }: SectionProps) {
  const { client } = proposal;
  const emailInvalid =
    client.contactEmail.trim().length > 0 &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.contactEmail.trim());

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Project basics</h2>
      <div className={styles.fieldGrid}>
        <div className={`${styles.field} ${styles.fieldWide}`}>
          <label htmlFor="pt-title" className={`${styles.label} ${styles.required}`}>
            Project title
          </label>
          <input
            id="pt-title"
            className={styles.input}
            type="text"
            value={proposal.projectTitle}
            placeholder="e.g. Website redesign and local-SEO program"
            onChange={(e) => dispatch({ type: 'set', patch: { projectTitle: e.target.value } })}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="pt-client" className={`${styles.label} ${styles.required}`}>
            Client / organization
          </label>
          <input
            id="pt-client"
            className={styles.input}
            type="text"
            value={client.clientName}
            placeholder="Acme Nonprofit"
            onChange={(e) => dispatch({ type: 'setClient', patch: { clientName: e.target.value } })}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="pt-orgtype" className={styles.label}>
            Organization type (optional)
          </label>
          <input
            id="pt-orgtype"
            className={styles.input}
            type="text"
            value={client.organizationType ?? ''}
            placeholder="nonprofit, small business…"
            onChange={(e) =>
              dispatch({ type: 'setClient', patch: { organizationType: e.target.value } })
            }
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="pt-contact" className={styles.label}>
            Contact name
          </label>
          <input
            id="pt-contact"
            className={styles.input}
            type="text"
            value={client.contactName}
            placeholder="Jane Doe"
            onChange={(e) =>
              dispatch({ type: 'setClient', patch: { contactName: e.target.value } })
            }
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="pt-email" className={`${styles.label} ${styles.required}`}>
            Contact email
          </label>
          <input
            id="pt-email"
            className={styles.input}
            type="email"
            value={client.contactEmail}
            placeholder="jane@example.org"
            aria-invalid={emailInvalid}
            onChange={(e) =>
              dispatch({ type: 'setClient', patch: { contactEmail: e.target.value } })
            }
          />
          {emailInvalid && (
            <p className={styles.error} role="alert">
              Enter a valid email address.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
