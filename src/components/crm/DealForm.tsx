'use client';

// "New deal" dialog (03-CRM-SCREENS.md): title, org picker-or-create, contact
// picker-or-create (the inline quick-add — no leaving the form), stage, value,
// services multi-select, next step + due date. Creates the picked-new org/contact
// first, then the deal; any failure keeps the form open with the values intact.

import { useState } from 'react';
import styles from './CrmApp.module.css';
import { useCrm } from './CrmContext';
import { PIPELINE_STAGES, STAGE_LABELS } from '@/lib/crm/labels';
import type { DealStage } from '@/lib/crm/types';

const NEW_SENTINEL = '__new__';

function PickerOrCreate({
  idPrefix,
  label,
  options,
  value,
  newName,
  createLabel,
  newPlaceholder,
  onPick,
  onNewName,
}: {
  idPrefix: string;
  label: string;
  options: { id: string; name: string }[];
  value: string; // '' = none, NEW_SENTINEL = creating
  newName: string;
  createLabel: string;
  newPlaceholder: string;
  onPick: (value: string) => void;
  onNewName: (name: string) => void;
}) {
  return (
    <>
      <div className={styles.field}>
        <label htmlFor={`${idPrefix}-pick`} className={styles.label}>
          {label}
        </label>
        <select
          id={`${idPrefix}-pick`}
          className={styles.select}
          value={value}
          onChange={(e) => onPick(e.target.value)}
        >
          <option value="">None</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
          <option value={NEW_SENTINEL}>{createLabel}</option>
        </select>
      </div>
      {value === NEW_SENTINEL && (
        <div className={styles.field}>
          <label
            htmlFor={`${idPrefix}-new`}
            className={`${styles.label} ${styles.required}`}
          >
            {label} name
          </label>
          <input
            id={`${idPrefix}-new`}
            className={styles.input}
            type="text"
            value={newName}
            placeholder={newPlaceholder}
            onChange={(e) => onNewName(e.target.value)}
          />
        </div>
      )}
    </>
  );
}

export default function DealForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (dealId: string) => void;
}) {
  const { data, serviceOptions, saveOrganization, saveContact, saveDeal } = useCrm();
  const [title, setTitle] = useState('');
  const [orgPick, setOrgPick] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [contactPick, setContactPick] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [stage, setStage] = useState<DealStage>('lead');
  const [value, setValue] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [nextStep, setNextStep] = useState('');
  const [nextStepDue, setNextStepDue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedValue = value.trim() === '' ? undefined : Number(value);
  const valueInvalid =
    parsedValue !== undefined && (!Number.isFinite(parsedValue) || parsedValue < 0);
  const ready =
    title.trim().length > 0 &&
    !valueInvalid &&
    (orgPick !== NEW_SENTINEL || newOrgName.trim().length > 0) &&
    (contactPick !== NEW_SENTINEL || newContactName.trim().length > 0);

  const toggleService = (service: string) => {
    setServices((current) =>
      current.includes(service)
        ? current.filter((s) => s !== service)
        : [...current, service],
    );
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready || saving) return;
    setSaving(true);
    setError(null);
    const now = new Date().toISOString();
    try {
      let organizationId = orgPick && orgPick !== NEW_SENTINEL ? orgPick : undefined;
      if (orgPick === NEW_SENTINEL) {
        organizationId = crypto.randomUUID();
        await saveOrganization({
          id: organizationId,
          name: newOrgName.trim(),
          createdAt: now,
        });
      }
      let primaryContactId =
        contactPick && contactPick !== NEW_SENTINEL ? contactPick : undefined;
      if (contactPick === NEW_SENTINEL) {
        primaryContactId = crypto.randomUUID();
        await saveContact({
          id: primaryContactId,
          name: newContactName.trim(),
          organizationId,
          source: 'other',
          createdAt: now,
        });
      }
      const dealId = crypto.randomUUID();
      await saveDeal({
        id: dealId,
        title: title.trim(),
        organizationId,
        primaryContactId,
        stage,
        estimatedValue: parsedValue,
        services: services.length ? services : undefined,
        nextStep: nextStep.trim() || undefined,
        nextStepDue: nextStepDue || undefined,
        stageHistory: [{ stage, at: now }],
        createdAt: now,
        updatedAt: now,
      });
      onCreated(dealId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the deal.');
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} role="presentation">
      <div
        className={`${styles.dialog} ${styles.dialogWide}`}
        role="dialog"
        aria-modal="true"
        aria-label="New deal"
      >
        <h2 className={styles.dialogTitle}>New deal</h2>
        <form onSubmit={submit} className={styles.fieldGrid}>
          <div className={`${styles.field} ${styles.fieldWide}`}>
            <label htmlFor="deal-title" className={`${styles.label} ${styles.required}`}>
              Title
            </label>
            <input
              id="deal-title"
              className={styles.input}
              type="text"
              value={title}
              placeholder="e.g. Sample Nonprofit Org site rebuild"
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <PickerOrCreate
            idPrefix="deal-org"
            label="Organization"
            options={data.organizations}
            value={orgPick}
            newName={newOrgName}
            createLabel="＋ New organization…"
            newPlaceholder="Sample Nonprofit Org"
            onPick={setOrgPick}
            onNewName={setNewOrgName}
          />
          <PickerOrCreate
            idPrefix="deal-contact"
            label="Primary contact"
            options={data.contacts}
            value={contactPick}
            newName={newContactName}
            createLabel="＋ New contact…"
            newPlaceholder="Jane Doe"
            onPick={setContactPick}
            onNewName={setNewContactName}
          />

          <div className={styles.field}>
            <label htmlFor="deal-stage" className={styles.label}>
              Stage
            </label>
            <select
              id="deal-stage"
              className={styles.select}
              value={stage}
              onChange={(e) => setStage(e.target.value as DealStage)}
            >
              {PIPELINE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="deal-value" className={styles.label}>
              Estimated value (USD)
            </label>
            <input
              id="deal-value"
              className={styles.input}
              type="number"
              min={0}
              step="any"
              value={value}
              placeholder="Optional"
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          <fieldset className={`${styles.field} ${styles.fieldWide}`} style={{ border: 0, padding: 0 }}>
            <legend className={styles.label} style={{ marginBottom: 6 }}>
              Services in play
            </legend>
            <div className={styles.checkGroup}>
              {serviceOptions.map((service) => (
                <label key={service} className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={services.includes(service)}
                    onChange={() => toggleService(service)}
                  />
                  {service}
                </label>
              ))}
            </div>
          </fieldset>

          <div className={styles.field}>
            <label htmlFor="deal-next" className={styles.label}>
              Next step
            </label>
            <input
              id="deal-next"
              className={styles.input}
              type="text"
              value={nextStep}
              placeholder="One line — the single next action"
              onChange={(e) => setNextStep(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="deal-due" className={styles.label}>
              Next step due
            </label>
            <input
              id="deal-due"
              className={styles.input}
              type="date"
              value={nextStepDue}
              onChange={(e) => setNextStepDue(e.target.value)}
            />
          </div>

          <div className={`${styles.fieldWide} ${styles.formActions}`}>
            {valueInvalid && (
              <p className={styles.formError}>Estimated value must be 0 or more.</p>
            )}
            {error && (
              <p className={styles.formError} role="alert">
                {error}
              </p>
            )}
            <button type="button" className={styles.ghostButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryButton} disabled={!ready || saving}>
              {saving ? 'Creating…' : 'Create deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
