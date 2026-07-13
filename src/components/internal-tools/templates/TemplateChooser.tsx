'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './TemplateChooser.module.css';
import ConfirmDialog from '@/components/internal-tools/ConfirmDialog';
import type { DocumentTemplate, TemplateDocumentType } from './templateTypes';
import { BUILT_IN_TEMPLATES } from './builtInTemplates';
import {
  deleteCustomTemplate,
  parseTemplateImport,
  saveCustomTemplate,
  templateToJson,
  useCustomTemplates,
} from './templateStorage';

interface TemplateChooserProps {
  documentType: TemplateDocumentType;
  /** Lowercase noun for copy, e.g. "proposal", "audit". */
  documentLabel: string;
  /** null = start blank. */
  onPick: (template: DocumentTemplate | null) => void;
}

/**
 * The new-document template chooser both tools open with: Blank first, then the
 * built-ins for this document type, then custom templates (visually badged). Custom
 * templates can be renamed, exported, deleted (confirmed), and new ones imported —
 * all with the same all-or-nothing validation as themes. Escape = start blank.
 */
export default function TemplateChooser({
  documentType,
  documentLabel,
  onPick,
}: TemplateChooserProps) {
  const customs = useCustomTemplates(documentType);
  const builtIns = BUILT_IN_TEMPLATES.filter((t) => t.documentType === documentType);
  const [error, setError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<DocumentTemplate | null>(null);
  const [deleting, setDeleting] = useState<DocumentTemplate | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !renaming && !deleting) onPick(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onPick, renaming, deleting]);

  const onImportFile = async (file: File) => {
    setError(null);
    const result = parseTemplateImport(await file.text());
    if (!result.template) {
      setError(result.error);
      return;
    }
    if (result.template.documentType !== documentType) {
      setError(
        `That file is a ${result.template.documentType} template — import it from the ${result.template.documentType} tool.`,
      );
      return;
    }
    const collision = customs.find(
      (t) =>
        t.id === result.template.id ||
        t.name.toLowerCase() === result.template.name.toLowerCase(),
    );
    const toSave = collision ? { ...result.template, id: collision.id } : result.template;
    const saved = saveCustomTemplate(toSave);
    setError(saved.ok ? null : saved.error);
  };

  const exportTemplate = (template: DocumentTemplate) => {
    const blob = new Blob([templateToJson(template)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bf-template-${template.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.overlay} role="presentation">
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-label={`New ${documentLabel}`}>
        <h2 className={styles.heading}>New {documentLabel}</h2>
        <p className={styles.subhead}>
          Start from a template, or begin blank. Templates pre-fill structure and theme —
          everything stays editable.
        </p>

        <div className={styles.grid}>
          <button type="button" className={styles.card} onClick={() => onPick(null)}>
            <span className={styles.cardName}>Blank</span>
            <span className={styles.cardDescription}>
              Empty {documentLabel} — everything from scratch.
            </span>
          </button>

          {builtIns.map((template) => (
            <button
              key={template.id}
              type="button"
              className={styles.card}
              onClick={() => onPick(template)}
            >
              <span className={styles.cardName}>
                {template.name}
                <span className={styles.badgeBuiltIn}>Built-in</span>
              </span>
              <span className={styles.cardDescription}>{template.description}</span>
            </button>
          ))}

          {customs.map((template) => (
            <div key={template.id} className={styles.customWrap}>
              <button
                type="button"
                className={styles.card}
                onClick={() => onPick(template)}
              >
                <span className={styles.cardName}>
                  {template.name}
                  <span className={styles.badgeCustom}>Custom</span>
                </span>
                <span className={styles.cardDescription}>
                  {template.description || 'Saved from a document.'}
                </span>
              </button>
              <div className={styles.manageRow}>
                <button
                  type="button"
                  className={styles.manageButton}
                  onClick={() => setRenaming(template)}
                >
                  Rename
                </button>
                <button
                  type="button"
                  className={styles.manageButton}
                  onClick={() => exportTemplate(template)}
                >
                  Export
                </button>
                <button
                  type="button"
                  className={`${styles.manageButton} ${styles.manageDanger}`}
                  onClick={() => setDeleting(template)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.footer}>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className={styles.hiddenFile}
            aria-label="Import template JSON file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void onImportFile(file);
            }}
          />
          <button
            type="button"
            className={styles.footerButton}
            onClick={() => importInputRef.current?.click()}
          >
            Import template…
          </button>
          <p className={styles.footerNote}>
            Custom templates live in this browser — export JSON to move them.
          </p>
        </div>
      </div>

      {renaming && (
        <ConfirmDialog
          title={`Rename "${renaming.name}"`}
          body="Documents already created from it are not affected."
          confirmLabel="Rename"
          promptLabel="New name"
          promptDefault={renaming.name}
          onConfirm={(value) => {
            const name = value.trim();
            if (!name) return;
            const saved = saveCustomTemplate({ ...renaming, name });
            if (!saved.ok) throw new Error(saved.error);
            setRenaming(null);
          }}
          onCancel={() => setRenaming(null)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Delete "${deleting.name}"?`}
          body="This removes the template from this browser. Documents created from it are not affected. Export it first if you might want it back."
          confirmLabel="Delete template"
          danger
          onConfirm={() => {
            deleteCustomTemplate(deleting.id);
            setDeleting(null);
          }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
