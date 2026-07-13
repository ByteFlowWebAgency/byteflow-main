'use client';

// Full deal view (03-CRM-SCREENS.md): every field editable, stage select with the
// lost-reason prompt, the stage history as a small timeline, the activity log filtered
// to this deal with inline logging, and links to its org/contact. Also where a
// document-sent activity notes which proposal/audit went out (free text).

import { useState } from 'react';
import styles from './CrmApp.module.css';
import { useCrm } from './CrmContext';
import ActivityPanel from './ActivityPanel';
import ConfirmDialog from './ConfirmDialog';
import { ALL_STAGES, STAGE_LABELS } from '@/lib/crm/labels';
import { dealReferences, describeCounts } from '@/lib/crm/references';
import { formatDisplayDate } from '@/lib/internal-tools/format';
import type { Deal, DealStage } from '@/lib/crm/types';

export default function DealDetail({
  dealId,
  onBack,
  onOpenContact,
  onOpenOrganization,
}: {
  dealId: string;
  onBack: () => void;
  onOpenContact: (id: string) => void;
  onOpenOrganization: (id: string) => void;
}) {
  const { data, serviceOptions, saveDeal, deleteDeal } = useCrm();
  const deal = data.deals.find((d) => d.id === dealId);
  const [draft, setDraft] = useState<Deal | null>(deal ? { ...deal } : null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [lostPrompt, setLostPrompt] = useState<DealStage | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!deal || !draft) {
    return (
      <div className={styles.stateBox}>
        <p className={styles.stateTitle}>Deal not found</p>
        <button type="button" className={styles.ghostButton} onClick={onBack}>
          Back to pipeline
        </button>
      </div>
    );
  }

  const organization = data.organizations.find((o) => o.id === deal.organizationId);
  const contact = data.contacts.find((c) => c.id === deal.primaryContactId);
  const dirty = JSON.stringify(draft) !== JSON.stringify(deal);

  const set = (patch: Partial<Deal>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
    setSavedFlash(false);
  };

  const persist = async (next: Deal) => {
    setSaving(true);
    setSaveError(null);
    try {
      const stored = await saveDeal(next);
      setDraft(stored);
      setSavedFlash(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed — try again.');
    } finally {
      setSaving(false);
    }
  };

  // Lost needs its reason first — collected in the ConfirmDialog, which surfaces any
  // save failure itself, so this throws instead of catching.
  const persistLost = async (reason: string) => {
    const stored = await saveDeal({
      ...draft,
      stage: 'lost',
      lostReason: reason,
      stageHistory: [
        ...deal.stageHistory,
        { stage: 'lost', at: new Date().toISOString() },
      ],
    });
    setDraft(stored);
  };

  // Stage changes persist immediately (with history), matching the board's behavior.
  const changeStage = (stage: DealStage) => {
    if (stage === deal.stage) return;
    if (stage === 'lost') {
      setLostPrompt(stage);
      return;
    }
    void persist({
      ...draft,
      stage,
      stageHistory: [...deal.stageHistory, { stage, at: new Date().toISOString() }],
    });
  };

  const references = dealReferences(data, deal.id);
  const parsedValue =
    draft.estimatedValue === undefined ? '' : String(draft.estimatedValue);

  return (
    <div>
      <button type="button" className={styles.backButton} onClick={onBack}>
        ← Back to pipeline
      </button>

      <div className={styles.detailLayout}>
        <div>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Deal</h2>
            <div className={styles.fieldGrid}>
              <div className={`${styles.field} ${styles.fieldWide}`}>
                <label htmlFor="dd-title" className={`${styles.label} ${styles.required}`}>
                  Title
                </label>
                <input
                  id="dd-title"
                  className={styles.input}
                  type="text"
                  value={draft.title}
                  onChange={(e) => set({ title: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="dd-stage" className={styles.label}>
                  Stage
                </label>
                <select
                  id="dd-stage"
                  className={styles.select}
                  value={deal.stage}
                  onChange={(e) => changeStage(e.target.value as DealStage)}
                >
                  {ALL_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {STAGE_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="dd-value" className={styles.label}>
                  Estimated value (USD)
                </label>
                <input
                  id="dd-value"
                  className={styles.input}
                  type="number"
                  min={0}
                  step="any"
                  value={parsedValue}
                  onChange={(e) =>
                    set({
                      estimatedValue:
                        e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="dd-org" className={styles.label}>
                  Organization
                </label>
                <select
                  id="dd-org"
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
                <label htmlFor="dd-contact" className={styles.label}>
                  Primary contact
                </label>
                <select
                  id="dd-contact"
                  className={styles.select}
                  value={draft.primaryContactId ?? ''}
                  onChange={(e) => set({ primaryContactId: e.target.value || undefined })}
                >
                  <option value="">None</option>
                  {data.contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <fieldset
                className={`${styles.field} ${styles.fieldWide}`}
                style={{ border: 0, padding: 0 }}
              >
                <legend className={styles.label} style={{ marginBottom: 6 }}>
                  Services in play
                </legend>
                <div className={styles.checkGroup}>
                  {serviceOptions.map((service) => (
                    <label key={service} className={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={(draft.services ?? []).includes(service)}
                        onChange={() => {
                          const current = draft.services ?? [];
                          const next = current.includes(service)
                            ? current.filter((s) => s !== service)
                            : [...current, service];
                          set({ services: next.length ? next : undefined });
                        }}
                      />
                      {service}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className={styles.field}>
                <label htmlFor="dd-next" className={styles.label}>
                  Next step
                </label>
                <input
                  id="dd-next"
                  className={styles.input}
                  type="text"
                  value={draft.nextStep ?? ''}
                  onChange={(e) => set({ nextStep: e.target.value || undefined })}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="dd-due" className={styles.label}>
                  Next step due
                </label>
                <input
                  id="dd-due"
                  className={styles.input}
                  type="date"
                  value={draft.nextStepDue ?? ''}
                  onChange={(e) => set({ nextStepDue: e.target.value || undefined })}
                />
              </div>

              {deal.stage === 'lost' && (
                <div className={`${styles.field} ${styles.fieldWide}`}>
                  <label htmlFor="dd-lost" className={styles.label}>
                    Lost reason
                  </label>
                  <input
                    id="dd-lost"
                    className={styles.input}
                    type="text"
                    value={draft.lostReason ?? ''}
                    onChange={(e) => set({ lostReason: e.target.value || undefined })}
                  />
                </div>
              )}
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
                Delete deal
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={!dirty || saving || !draft.title.trim()}
                onClick={() => void persist(draft)}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Links</h3>
            <div className={styles.refList}>
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
                  <span className={deal.organizationId ? styles.deletedRef : styles.cellMuted}>
                    {deal.organizationId ? '[deleted organization]' : 'None'}
                  </span>
                )}
              </div>
              <div className={styles.refRow}>
                <span className={styles.cellMuted}>Primary contact</span>
                {contact ? (
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => onOpenContact(contact.id)}
                  >
                    {contact.name}
                  </button>
                ) : (
                  <span className={deal.primaryContactId ? styles.deletedRef : styles.cellMuted}>
                    {deal.primaryContactId ? '[deleted contact]' : 'None'}
                  </span>
                )}
              </div>
            </div>
          </section>

          <ActivityPanel dealId={deal.id} />
        </div>

        <div>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Stage history</h3>
            <div className={styles.timeline}>
              {[...deal.stageHistory].reverse().map((step, index) => (
                <div key={`${step.at}-${index}`} className={styles.timelineItem}>
                  <p className={styles.timelineStage}>{STAGE_LABELS[step.stage]}</p>
                  <p className={styles.timelineDate}>{formatDisplayDate(step.at)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {lostPrompt && (
        <ConfirmDialog
          title={`Mark “${deal.title}” as lost`}
          body="Lost deals stay on record — the why is the useful part."
          confirmLabel="Mark lost"
          danger
          promptLabel="Reason"
          promptPlaceholder="e.g. Budget went elsewhere"
          onCancel={() => setLostPrompt(null)}
          onConfirm={async (reason) => {
            await persistLost(reason);
            setLostPrompt(null);
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete “${deal.title}”?`}
          body={
            references.activities.length > 0
              ? `Referenced by ${describeCounts([
                  {
                    count: references.activities.length,
                    noun: 'activity',
                    plural: 'activities',
                  },
                ])}. History survives with dangling links rendered gracefully. Consider marking it lost instead — lost deals carry pattern information.`
              : 'Consider marking it lost instead — lost deals carry pattern information. Deleting is permanent.'
          }
          confirmLabel="Delete deal"
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await deleteDeal(deal.id);
            onBack();
          }}
        />
      )}
    </div>
  );
}
