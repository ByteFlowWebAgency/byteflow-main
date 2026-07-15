'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './chooser.module.css';
import ConfirmDialog from '../ConfirmDialog';
import {
  BUILT_IN_TEMPLATES,
  useCustomTemplates,
  instantiateTemplate,
  templateToJson,
  parseTemplateImport,
  saveCustomTemplate,
  deleteCustomTemplate,
  renameCustomTemplate,
} from './templateStorage';
import { createBlankDocument } from '@/lib/document-builder/defaults';
import type { DocTemplate } from './templateTypes';
import type { BuiltDocument } from '@/lib/document-builder/types';

interface TemplateChooserProps {
  onCreate: (doc: BuiltDocument) => void;
  onClose: () => void;
}

function download(name: string, json: string) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TemplateChooser({ onCreate, onClose }: TemplateChooserProps) {
  const custom = useCustomTemplates();
  const [importError, setImportError] = useState('');
  const [dialog, setDialog] = useState<{ kind: 'rename' | 'delete'; template: DocTemplate } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !dialog) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, dialog]);

  // Group built-ins + customs by category, preserving encounter order.
  const grouped = useMemo(() => {
    const map = new Map<string, DocTemplate[]>();
    for (const t of [...BUILT_IN_TEMPLATES, ...custom]) {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return [...map.entries()];
  }, [custom]);

  function onImportFile(file: File | undefined) {
    setImportError('');
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = parseTemplateImport(String(reader.result));
      if (!result.template) {
        setImportError(result.error ?? 'That file could not be imported.');
        return;
      }
      saveCustomTemplate(result.template);
    };
    reader.readAsText(file);
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Choose a template">
      <div className={styles.chooser}>
        <header className={styles.chooserHead}>
          <h2 className={styles.dialogTitle}>New document</h2>
          <div className={styles.chooserHeadActions}>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                onImportFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <button type="button" className={styles.ghostBtn} onClick={() => fileRef.current?.click()}>
              Import template
            </button>
            <button type="button" className={styles.ghostBtn} onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </header>

        {importError && (
          <p className={styles.error} role="alert">
            {importError}
          </p>
        )}

        <div className={styles.chooserBody}>
          {/* Blank pinned first, outside any category. */}
          <section className={styles.group}>
            <h3 className={styles.groupHead}>Start</h3>
            <div className={styles.cards}>
              <button type="button" className={styles.card} onClick={() => onCreate(createBlankDocument())}>
                <span className={styles.cardName}>Blank</span>
                <span className={styles.cardDesc}>A cover page and one empty content page.</span>
              </button>
            </div>
          </section>

          {grouped.map(([category, templates]) => (
            <section key={category} className={styles.group}>
              <h3 className={styles.groupHead}>{category}</h3>
              <div className={styles.cards}>
                {templates.map((t) => (
                  <div key={t.id} className={styles.cardWrap}>
                    <button type="button" className={styles.card} onClick={() => onCreate(instantiateTemplate(t))}>
                      <span className={styles.cardName}>
                        {t.name}
                        {!t.isBuiltIn && <span className={styles.badge}>Custom</span>}
                      </span>
                      <span className={styles.cardDesc}>{t.description}</span>
                    </button>
                    {!t.isBuiltIn && (
                      <div className={styles.cardManage}>
                        <button type="button" onClick={() => setDialog({ kind: 'rename', template: t })}>
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => download(`bf-builder-template-${t.name.replace(/\s+/g, '-').toLowerCase()}.json`, templateToJson(t))}
                        >
                          Export
                        </button>
                        <button type="button" className={styles.danger} onClick={() => setDialog({ kind: 'delete', template: t })}>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {dialog?.kind === 'rename' && (
        <ConfirmDialog
          title="Rename template"
          body="Give this template a new name."
          confirmLabel="Rename"
          promptLabel="Template name"
          promptDefault={dialog.template.name}
          onCancel={() => setDialog(null)}
          onConfirm={(value) => {
            renameCustomTemplate(dialog.template.id, value);
            setDialog(null);
          }}
        />
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          title="Delete template"
          body={`Delete “${dialog.template.name}”? Documents already created from it are not affected.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setDialog(null)}
          onConfirm={() => {
            deleteCustomTemplate(dialog.template.id);
            setDialog(null);
          }}
        />
      )}
    </div>
  );
}
