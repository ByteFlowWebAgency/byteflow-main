'use client';

// Contacts (03-CRM-SCREENS.md view 2): searchable, sortable table plus the
// "New contact" dialog with the referred-by picker shown for warm intros.

import { useMemo, useState } from 'react';
import styles from './CrmApp.module.css';
import { useCrm } from './CrmContext';
import { CONNECTION_SOURCES, SOURCE_LABELS } from '@/lib/crm/labels';
import { lookupName } from '@/lib/crm/references';
import { formatDisplayDate } from '@/lib/internal-tools/format';
import type { Contact, ConnectionSource } from '@/lib/crm/types';

type SortKey = 'name' | 'org' | 'role' | 'source' | 'email' | 'created';

export default function ContactsView({
  onOpenContact,
}: {
  onOpenContact: (id: string) => void;
}) {
  const { data } = useCrm();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const sortable: Record<SortKey, (c: Contact) => string> = useMemo(
    () => ({
      name: (c) => c.name.toLowerCase(),
      org: (c) =>
        (lookupName(data.organizations, c.organizationId, '') ?? '').toLowerCase(),
      role: (c) => (c.role ?? '').toLowerCase(),
      source: (c) => SOURCE_LABELS[c.source] ?? c.source,
      email: (c) => (c.email ?? '').toLowerCase(),
      created: (c) => c.createdAt,
    }),
    [data.organizations],
  );

  const contacts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const filtered = needle
      ? data.contacts.filter((c) =>
          `${c.name} ${c.email ?? ''} ${c.role ?? ''} ${
            lookupName(data.organizations, c.organizationId, '') ?? ''
          }`
            .toLowerCase()
            .includes(needle),
        )
      : data.contacts;
    const keyOf = sortable[sortKey];
    return [...filtered].sort(
      (a, b) => keyOf(a).localeCompare(keyOf(b)) * (sortAsc ? 1 : -1),
    );
  }, [data.contacts, data.organizations, search, sortKey, sortAsc, sortable]);

  const sortBy = (key: SortKey) => {
    if (key === sortKey) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const header = (key: SortKey, label: string) => (
    <th scope="col">
      <button type="button" className={styles.thButton} onClick={() => sortBy(key)}>
        {label}
        {sortKey === key ? (sortAsc ? ' ↑' : ' ↓') : ''}
      </button>
    </th>
  );

  return (
    <div>
      <div className={styles.tableControls}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search contacts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search contacts"
        />
        <button type="button" className={styles.primaryButton} onClick={() => setShowNew(true)}>
          New contact
        </button>
      </div>

      {data.contacts.length === 0 ? (
        <div className={styles.stateBox}>
          <p className={styles.stateTitle}>No contacts yet</p>
          <p>Every relationship starts somewhere — add the first person you&apos;re talking to.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {header('name', 'Name')}
                {header('org', 'Organization')}
                {header('role', 'Role')}
                {header('source', 'Source')}
                {header('email', 'Email')}
                {header('created', 'Created')}
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => {
                const orgName = lookupName(
                  data.organizations,
                  contact.organizationId,
                  '[deleted organization]',
                );
                return (
                  <tr key={contact.id}>
                    <td>
                      <button
                        type="button"
                        className={styles.linkButton}
                        onClick={() => onOpenContact(contact.id)}
                      >
                        {contact.name}
                      </button>
                    </td>
                    <td className={styles.cellMuted}>{orgName ?? '—'}</td>
                    <td className={styles.cellMuted}>{contact.role ?? '—'}</td>
                    <td className={styles.cellMuted}>{SOURCE_LABELS[contact.source]}</td>
                    <td className={styles.cellMuted}>{contact.email ?? '—'}</td>
                    <td className={styles.cellMuted}>
                      {formatDisplayDate(contact.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <ContactFormDialog
          onClose={() => setShowNew(false)}
          onCreated={(id) => {
            setShowNew(false);
            onOpenContact(id);
          }}
        />
      )}
    </div>
  );
}

export function ContactFormDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { data, saveContact, saveOrganization } = useCrm();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [orgPick, setOrgPick] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [source, setSource] = useState<ConnectionSource>('networking');
  const [referredBy, setReferredBy] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready =
    name.trim().length > 0 && (orgPick !== '__new__' || newOrgName.trim().length > 0);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready || saving) return;
    setSaving(true);
    setError(null);
    const now = new Date().toISOString();
    try {
      let organizationId = orgPick && orgPick !== '__new__' ? orgPick : undefined;
      if (orgPick === '__new__') {
        organizationId = crypto.randomUUID();
        await saveOrganization({
          id: organizationId,
          name: newOrgName.trim(),
          createdAt: now,
        });
      }
      const id = crypto.randomUUID();
      await saveContact({
        id,
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        role: role.trim() || undefined,
        organizationId,
        source,
        referredByContactId:
          source === 'warm-intro' && referredBy ? referredBy : undefined,
        notes: notes.trim() || undefined,
        createdAt: now,
      });
      onCreated(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the contact.');
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} role="presentation">
      <div
        className={`${styles.dialog} ${styles.dialogWide}`}
        role="dialog"
        aria-modal="true"
        aria-label="New contact"
      >
        <h2 className={styles.dialogTitle}>New contact</h2>
        <form onSubmit={submit} className={styles.fieldGrid}>
          <div className={styles.field}>
            <label htmlFor="ct-name" className={`${styles.label} ${styles.required}`}>
              Name
            </label>
            <input
              id="ct-name"
              className={styles.input}
              type="text"
              value={name}
              placeholder="Jane Doe"
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="ct-role" className={styles.label}>
              Role
            </label>
            <input
              id="ct-role"
              className={styles.input}
              type="text"
              value={role}
              placeholder="Executive Director"
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="ct-email" className={styles.label}>
              Email
            </label>
            <input
              id="ct-email"
              className={styles.input}
              type="email"
              value={email}
              placeholder="jane@example.org"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="ct-phone" className={styles.label}>
              Phone
            </label>
            <input
              id="ct-phone"
              className={styles.input}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="ct-org" className={styles.label}>
              Organization
            </label>
            <select
              id="ct-org"
              className={styles.select}
              value={orgPick}
              onChange={(e) => setOrgPick(e.target.value)}
            >
              <option value="">None</option>
              {data.organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
              <option value="__new__">＋ New organization…</option>
            </select>
          </div>
          {orgPick === '__new__' ? (
            <div className={styles.field}>
              <label htmlFor="ct-org-new" className={`${styles.label} ${styles.required}`}>
                Organization name
              </label>
              <input
                id="ct-org-new"
                className={styles.input}
                type="text"
                value={newOrgName}
                placeholder="Sample Nonprofit Org"
                onChange={(e) => setNewOrgName(e.target.value)}
              />
            </div>
          ) : (
            <div className={styles.field} aria-hidden />
          )}

          <div className={styles.field}>
            <label htmlFor="ct-source" className={styles.label}>
              How did the connection happen?
            </label>
            <select
              id="ct-source"
              className={styles.select}
              value={source}
              onChange={(e) => setSource(e.target.value as ConnectionSource)}
            >
              {CONNECTION_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {SOURCE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          {source === 'warm-intro' ? (
            <div className={styles.field}>
              <label htmlFor="ct-ref" className={styles.label}>
                Referred by
              </label>
              <select
                id="ct-ref"
                className={styles.select}
                value={referredBy}
                onChange={(e) => setReferredBy(e.target.value)}
              >
                <option value="">Not sure / not listed</option>
                {data.contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className={styles.field} aria-hidden />
          )}

          <div className={`${styles.field} ${styles.fieldWide}`}>
            <label htmlFor="ct-notes" className={styles.label}>
              Notes
            </label>
            <textarea
              id="ct-notes"
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
            <button type="submit" className={styles.primaryButton} disabled={!ready || saving}>
              {saving ? 'Creating…' : 'Create contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
