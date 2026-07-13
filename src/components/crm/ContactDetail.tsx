'use client';

// Contact detail (03-CRM-SCREENS.md): all fields editable in place, the referral link
// in BOTH directions (who referred them, and who they referred — the referral web),
// their activity timeline with inline logging, attached deals, and graceful deletion
// with reference counts.

import { useState } from 'react';
import styles from './CrmApp.module.css';
import { useCrm } from './CrmContext';
import ActivityPanel from './ActivityPanel';
import ConfirmDialog from './ConfirmDialog';
import { CONNECTION_SOURCES, SOURCE_LABELS, STAGE_LABELS } from '@/lib/crm/labels';
import { contactReferences, describeCounts } from '@/lib/crm/references';
import type { Contact, ConnectionSource } from '@/lib/crm/types';

export default function ContactDetail({
  contactId,
  onBack,
  onOpenContact,
  onOpenDeal,
  onOpenOrganization,
}: {
  contactId: string;
  onBack: () => void;
  onOpenContact: (id: string) => void;
  onOpenDeal: (id: string) => void;
  onOpenOrganization: (id: string) => void;
}) {
  const { data, saveContact, deleteContact } = useCrm();
  const contact = data.contacts.find((c) => c.id === contactId);
  const [draft, setDraft] = useState<Contact | null>(contact ? { ...contact } : null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!contact || !draft) {
    return (
      <div className={styles.stateBox}>
        <p className={styles.stateTitle}>Contact not found</p>
        <button type="button" className={styles.ghostButton} onClick={onBack}>
          Back to contacts
        </button>
      </div>
    );
  }

  const references = contactReferences(data, contact.id);
  const referredBy = data.contacts.find((c) => c.id === contact.referredByContactId);
  const organization = data.organizations.find((o) => o.id === contact.organizationId);
  const dirty = JSON.stringify(draft) !== JSON.stringify(contact);

  const set = (patch: Partial<Contact>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
    setSavedFlash(false);
  };

  const persist = async () => {
    if (!draft.name.trim() || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveContact(draft);
      setSavedFlash(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed — try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <button type="button" className={styles.backButton} onClick={onBack}>
        ← Back to contacts
      </button>

      <div className={styles.detailLayout}>
        <div>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Contact</h2>
            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <label htmlFor="cd-name" className={`${styles.label} ${styles.required}`}>
                  Name
                </label>
                <input
                  id="cd-name"
                  className={styles.input}
                  type="text"
                  value={draft.name}
                  onChange={(e) => set({ name: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="cd-role" className={styles.label}>
                  Role
                </label>
                <input
                  id="cd-role"
                  className={styles.input}
                  type="text"
                  value={draft.role ?? ''}
                  onChange={(e) => set({ role: e.target.value || undefined })}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="cd-email" className={styles.label}>
                  Email
                </label>
                <input
                  id="cd-email"
                  className={styles.input}
                  type="email"
                  value={draft.email ?? ''}
                  onChange={(e) => set({ email: e.target.value || undefined })}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="cd-phone" className={styles.label}>
                  Phone
                </label>
                <input
                  id="cd-phone"
                  className={styles.input}
                  type="tel"
                  value={draft.phone ?? ''}
                  onChange={(e) => set({ phone: e.target.value || undefined })}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="cd-org" className={styles.label}>
                  Organization
                </label>
                <select
                  id="cd-org"
                  className={styles.select}
                  value={draft.organizationId ?? ''}
                  onChange={(e) => set({ organizationId: e.target.value || undefined })}
                >
                  <option value="">None</option>
                  {data.organizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="cd-source" className={styles.label}>
                  Source
                </label>
                <select
                  id="cd-source"
                  className={styles.select}
                  value={draft.source}
                  onChange={(e) => set({ source: e.target.value as ConnectionSource })}
                >
                  {CONNECTION_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {SOURCE_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              {draft.source === 'warm-intro' && (
                <div className={styles.field}>
                  <label htmlFor="cd-ref" className={styles.label}>
                    Referred by
                  </label>
                  <select
                    id="cd-ref"
                    className={styles.select}
                    value={draft.referredByContactId ?? ''}
                    onChange={(e) =>
                      set({ referredByContactId: e.target.value || undefined })
                    }
                  >
                    <option value="">Not sure / not listed</option>
                    {data.contacts
                      .filter((c) => c.id !== contact.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              <div className={`${styles.field} ${styles.fieldWide}`}>
                <label htmlFor="cd-notes" className={styles.label}>
                  Notes
                </label>
                <textarea
                  id="cd-notes"
                  className={styles.textarea}
                  value={draft.notes ?? ''}
                  rows={3}
                  onChange={(e) => set({ notes: e.target.value || undefined })}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              {saveError && (
                <p className={styles.formError} role="alert">
                  {saveError}
                </p>
              )}
              {savedFlash && !dirty && <p className={styles.hint}>Saved.</p>}
              <button
                type="button"
                className={styles.dangerButton}
                onClick={() => setConfirmDelete(true)}
              >
                Delete contact
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={!dirty || saving || !draft.name.trim()}
                onClick={() => void persist()}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </section>

          <ActivityPanel
            contactId={contact.id}
            linkLabel={(activity) => {
              const deal = data.deals.find((d) => d.id === activity.dealId);
              return deal ? deal.title : activity.dealId ? '[deleted deal]' : null;
            }}
          />
        </div>

        <div>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Referral web</h3>
            <div className={styles.refList}>
              <div className={styles.refRow}>
                <span className={styles.cellMuted}>Referred by</span>
                {referredBy ? (
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => onOpenContact(referredBy.id)}
                  >
                    {referredBy.name}
                  </button>
                ) : (
                  <span
                    className={
                      contact.referredByContactId ? styles.deletedRef : styles.cellMuted
                    }
                  >
                    {contact.referredByContactId ? '[deleted contact]' : '—'}
                  </span>
                )}
              </div>
              <div className={styles.refRow}>
                <span className={styles.cellMuted}>Referred</span>
                {references.referrals.length === 0 ? (
                  <span className={styles.cellMuted}>Nobody yet</span>
                ) : (
                  <span style={{ textAlign: 'right' }}>
                    {references.referrals.map((c, i) => (
                      <span key={c.id}>
                        {i > 0 && ', '}
                        <button
                          type="button"
                          className={styles.linkButton}
                          onClick={() => onOpenContact(c.id)}
                        >
                          {c.name}
                        </button>
                      </span>
                    ))}
                  </span>
                )}
              </div>
              <div className={styles.refRow}>
                <span className={styles.cellMuted}>Organization</span>
                {organization ? (
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => onOpenOrganization(organization.id)}
                  >
                    {organization.name}
                  </button>
                ) : (
                  <span
                    className={contact.organizationId ? styles.deletedRef : styles.cellMuted}
                  >
                    {contact.organizationId ? '[deleted organization]' : '—'}
                  </span>
                )}
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Deals</h3>
            <div className={styles.refList}>
              {references.deals.length === 0 ? (
                <p className={styles.hint}>No deals attached to this contact.</p>
              ) : (
                references.deals.map((deal) => (
                  <div key={deal.id} className={styles.refRow}>
                    <button
                      type="button"
                      className={styles.linkButton}
                      onClick={() => onOpenDeal(deal.id)}
                    >
                      {deal.title}
                    </button>
                    <span className={styles.cellMuted}>{STAGE_LABELS[deal.stage]}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${contact.name}?`}
          body={
            describeCounts([
              { count: references.deals.length, noun: 'deal' },
              {
                count: references.activities.length,
                noun: 'activity',
                plural: 'activities',
              },
              { count: references.referrals.length, noun: 'referral' },
            ])
              ? `Referenced by ${describeCounts([
                  { count: references.deals.length, noun: 'deal' },
                  {
                    count: references.activities.length,
                    noun: 'activity',
                    plural: 'activities',
                  },
                  { count: references.referrals.length, noun: 'referral' },
                ])}. Those references are cleared — the records themselves survive.`
              : 'Nothing references this contact. Deleting is permanent.'
          }
          confirmLabel="Delete contact"
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await deleteContact(contact.id);
            onBack();
          }}
        />
      )}
    </div>
  );
}
