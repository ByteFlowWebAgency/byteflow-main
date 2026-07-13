'use client';

// Organizations (03-CRM-SCREENS.md view 3): simple table with contact/deal counts,
// a "New organization" dialog, and a detail view with editable fields, linked
// contacts/deals, and graceful deletion.

import { useMemo, useState } from 'react';
import styles from './CrmApp.module.css';
import { useCrm } from './CrmContext';
import ConfirmDialog from './ConfirmDialog';
import { STAGE_LABELS } from '@/lib/crm/labels';
import { describeCounts, organizationReferences } from '@/lib/crm/references';
import type { Organization } from '@/lib/crm/types';

export default function OrganizationsView({
  onOpenOrganization,
}: {
  onOpenOrganization: (id: string) => void;
}) {
  const { data } = useCrm();
  const [showNew, setShowNew] = useState(false);

  const rows = useMemo(
    () =>
      [...data.organizations]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((org) => ({
          org,
          contactCount: data.contacts.filter((c) => c.organizationId === org.id).length,
          dealCount: data.deals.filter((d) => d.organizationId === org.id).length,
        })),
    [data],
  );

  return (
    <div>
      <div className={styles.tableControls}>
        <span className={styles.hint}>
          {rows.length} organization{rows.length === 1 ? '' : 's'}
        </span>
        <button type="button" className={styles.primaryButton} onClick={() => setShowNew(true)}>
          New organization
        </button>
      </div>

      {rows.length === 0 ? (
        <div className={styles.stateBox}>
          <p className={styles.stateTitle}>No organizations yet</p>
          <p>Add the orgs behind your contacts — e.g. “Sample Nonprofit Org”.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">
                  <span className={styles.thButton} style={{ cursor: 'default' }}>
                    Name
                  </span>
                </th>
                <th scope="col">
                  <span className={styles.thButton} style={{ cursor: 'default' }}>
                    Type
                  </span>
                </th>
                <th scope="col">
                  <span className={styles.thButton} style={{ cursor: 'default' }}>
                    Website
                  </span>
                </th>
                <th scope="col">
                  <span className={styles.thButton} style={{ cursor: 'default' }}>
                    Contacts
                  </span>
                </th>
                <th scope="col">
                  <span className={styles.thButton} style={{ cursor: 'default' }}>
                    Deals
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ org, contactCount, dealCount }) => (
                <tr key={org.id}>
                  <td>
                    <button
                      type="button"
                      className={styles.linkButton}
                      onClick={() => onOpenOrganization(org.id)}
                    >
                      {org.name}
                    </button>
                  </td>
                  <td className={styles.cellMuted}>{org.orgType ?? '—'}</td>
                  <td className={styles.cellMuted}>{org.website ?? '—'}</td>
                  <td className={styles.cellMuted}>{contactCount}</td>
                  <td className={styles.cellMuted}>{dealCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <OrganizationFormDialog
          onClose={() => setShowNew(false)}
          onCreated={(id) => {
            setShowNew(false);
            onOpenOrganization(id);
          }}
        />
      )}
    </div>
  );
}

function OrganizationFormDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { saveOrganization } = useCrm();
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [orgType, setOrgType] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const id = crypto.randomUUID();
      await saveOrganization({
        id,
        name: name.trim(),
        website: website.trim() || undefined,
        orgType: orgType.trim() || undefined,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      });
      onCreated(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the organization.');
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} role="presentation">
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-label="New organization">
        <h2 className={styles.dialogTitle}>New organization</h2>
        <form onSubmit={submit} className={styles.fieldGrid}>
          <div className={`${styles.field} ${styles.fieldWide}`}>
            <label htmlFor="og-name" className={`${styles.label} ${styles.required}`}>
              Name
            </label>
            <input
              id="og-name"
              className={styles.input}
              type="text"
              value={name}
              placeholder="Sample Nonprofit Org"
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="og-type" className={styles.label}>
              Type
            </label>
            <input
              id="og-type"
              className={styles.input}
              type="text"
              value={orgType}
              placeholder="nonprofit, barbershop, CDC…"
              onChange={(e) => setOrgType(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="og-site" className={styles.label}>
              Website
            </label>
            <input
              id="og-site"
              className={styles.input}
              type="text"
              inputMode="url"
              value={website}
              placeholder="example.org"
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
          <div className={`${styles.field} ${styles.fieldWide}`}>
            <label htmlFor="og-notes" className={styles.label}>
              Notes
            </label>
            <textarea
              id="og-notes"
              className={styles.textarea}
              value={notes}
              rows={2}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className={`${styles.fieldWide} ${styles.formActions}`}>
            {error && (
              <p className={styles.formError} role="alert">
                {error}
              </p>
            )}
            <button type="button" className={styles.ghostButton} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={!name.trim() || saving}
            >
              {saving ? 'Creating…' : 'Create organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function OrganizationDetail({
  organizationId,
  onBack,
  onOpenContact,
  onOpenDeal,
}: {
  organizationId: string;
  onBack: () => void;
  onOpenContact: (id: string) => void;
  onOpenDeal: (id: string) => void;
}) {
  const { data, saveOrganization, deleteOrganization } = useCrm();
  const organization = data.organizations.find((o) => o.id === organizationId);
  const [draft, setDraft] = useState<Organization | null>(
    organization ? { ...organization } : null,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!organization || !draft) {
    return (
      <div className={styles.stateBox}>
        <p className={styles.stateTitle}>Organization not found</p>
        <button type="button" className={styles.ghostButton} onClick={onBack}>
          Back to organizations
        </button>
      </div>
    );
  }

  const references = organizationReferences(data, organization.id);
  const dirty = JSON.stringify(draft) !== JSON.stringify(organization);

  const set = (patch: Partial<Organization>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
    setSavedFlash(false);
  };

  const persist = async () => {
    if (!draft.name.trim() || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveOrganization(draft);
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
        ← Back to organizations
      </button>

      <div className={styles.detailLayout}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Organization</h2>
          <div className={styles.fieldGrid}>
            <div className={`${styles.field} ${styles.fieldWide}`}>
              <label htmlFor="od-name" className={`${styles.label} ${styles.required}`}>
                Name
              </label>
              <input
                id="od-name"
                className={styles.input}
                type="text"
                value={draft.name}
                onChange={(e) => set({ name: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="od-type" className={styles.label}>
                Type
              </label>
              <input
                id="od-type"
                className={styles.input}
                type="text"
                value={draft.orgType ?? ''}
                onChange={(e) => set({ orgType: e.target.value || undefined })}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="od-site" className={styles.label}>
                Website
              </label>
              <input
                id="od-site"
                className={styles.input}
                type="text"
                inputMode="url"
                value={draft.website ?? ''}
                onChange={(e) => set({ website: e.target.value || undefined })}
              />
            </div>
            <div className={`${styles.field} ${styles.fieldWide}`}>
              <label htmlFor="od-notes" className={styles.label}>
                Notes
              </label>
              <textarea
                id="od-notes"
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
              Delete organization
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

        <div>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Contacts</h3>
            <div className={styles.refList}>
              {references.contacts.length === 0 ? (
                <p className={styles.hint}>No contacts at this organization yet.</p>
              ) : (
                references.contacts.map((c) => (
                  <div key={c.id} className={styles.refRow}>
                    <button
                      type="button"
                      className={styles.linkButton}
                      onClick={() => onOpenContact(c.id)}
                    >
                      {c.name}
                    </button>
                    <span className={styles.cellMuted}>{c.role ?? ''}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Deals</h3>
            <div className={styles.refList}>
              {references.deals.length === 0 ? (
                <p className={styles.hint}>No deals with this organization yet.</p>
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
          title={`Delete ${organization.name}?`}
          body={
            references.contacts.length + references.deals.length > 0
              ? `Referenced by ${describeCounts([
                  { count: references.contacts.length, noun: 'contact' },
                  { count: references.deals.length, noun: 'deal' },
                ])}. Those references are cleared — the records themselves survive.`
              : 'Nothing references this organization. Deleting is permanent.'
          }
          confirmLabel="Delete organization"
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await deleteOrganization(organization.id);
            onBack();
          }}
        />
      )}
    </div>
  );
}
