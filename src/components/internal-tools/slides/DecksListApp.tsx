'use client';

// The Presentations decks list — same shape as Document Builder's DocumentsListApp: new/
// import, open/duplicate/rename/export-JSON/delete-with-confirm. No template-deck concept
// (docs/slides/03-EDITOR-SCREEN.md) — "New deck" always starts from the same blank
// titleCover-only starting point; the 25 *slide* templates are the unit of reuse.

import '@/components/internal-tools/tokens.css';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Reused as-is — this list layout is fully generic, not document-builder-specific.
import styles from '../document-builder/list.module.css';
import ConfirmDialog from '@/components/internal-tools/ConfirmDialog';
import { resolveTheme } from '@/components/internal-tools/themes/themeStorage';
import { formatDisplayDate } from '@/lib/internal-tools/format';
import { createDefaultDeck } from '@/lib/slides/defaults';
import {
  useDecks,
  saveDeck,
  deleteDeck,
  getDeck,
  deckToJson,
  parseDeckImport,
} from '@/lib/slides/storage';
import type { Deck } from '@/lib/slides/types';

type Dialog = { kind: 'rename' | 'delete'; deck: Deck } | null;

function download(name: string, json: string) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DecksListApp() {
  const router = useRouter();
  const decks = useDecks();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function createNew() {
    const deck = createDefaultDeck();
    const result = saveDeck(deck);
    if (result.ok) router.push(`/internal/slides/${deck.id}`);
  }

  function duplicate(source: Deck) {
    const now = new Date().toISOString();
    const copy: Deck = {
      ...source,
      id: crypto.randomUUID(),
      name: `${source.name} (copy)`,
      createdAt: now,
      updatedAt: now,
    };
    saveDeck(copy);
  }

  function onImportFile(file: File | undefined) {
    setImportError('');
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = parseDeckImport(String(reader.result));
      if (!result.deck) {
        setImportError(result.error ?? 'That file could not be imported.');
        return;
      }
      saveDeck(result.deck);
    };
    reader.readAsText(file);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Presentations</h1>
          <p className={styles.subtitle}>
            BYTEFLOW-branded slide decks — assemble from 25 fixed templates, download as a
            real, editable .pptx.
          </p>
        </div>
        <div className={styles.headerActions}>
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
          <button type="button" className={styles.secondaryBtn} onClick={() => fileRef.current?.click()}>
            Import deck
          </button>
          <button type="button" className={styles.primaryBtn} onClick={createNew}>
            + New deck
          </button>
        </div>
      </header>

      {importError && (
        <p className={styles.importError} role="alert">
          {importError}
        </p>
      )}

      {decks.length === 0 ? (
        <div className={styles.empty}>
          <p>No decks yet.</p>
          <button type="button" className={styles.primaryBtn} onClick={createNew}>
            Create your first deck
          </button>
        </div>
      ) : (
        <ul className={styles.grid}>
          {decks.map((deck) => {
            const { theme } = resolveTheme(deck.themeId);
            return (
              <li key={deck.id} className={styles.card}>
                <Link href={`/internal/slides/${deck.id}`} className={styles.cardMain}>
                  <span className={styles.cardName}>{deck.name}</span>
                  <span className={styles.cardMeta}>
                    {deck.slides.length} slide{deck.slides.length === 1 ? '' : 's'} · {theme.name}
                  </span>
                  <span className={styles.cardDate}>Updated {formatDisplayDate(deck.updatedAt)}</span>
                </Link>
                <div className={styles.cardActions}>
                  <Link href={`/internal/slides/${deck.id}`} className={styles.cardAction}>
                    Open
                  </Link>
                  <button type="button" className={styles.cardAction} onClick={() => duplicate(deck)}>
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className={styles.cardAction}
                    onClick={() => setDialog({ kind: 'rename', deck })}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    className={styles.cardAction}
                    onClick={() => download(`bf-slides-${deck.id.slice(0, 8)}.json`, deckToJson(deck))}
                  >
                    Export JSON
                  </button>
                  <button
                    type="button"
                    className={`${styles.cardAction} ${styles.danger}`}
                    onClick={() => setDialog({ kind: 'delete', deck })}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {dialog?.kind === 'rename' && (
        <ConfirmDialog
          title="Rename deck"
          body="Give this deck a new name."
          confirmLabel="Rename"
          promptLabel="Deck name"
          promptDefault={dialog.deck.name}
          onCancel={() => setDialog(null)}
          onConfirm={(value) => {
            const fresh = getDeck(dialog.deck.id);
            if (fresh) saveDeck({ ...fresh, name: value.trim() || fresh.name, updatedAt: new Date().toISOString() });
            setDialog(null);
          }}
        />
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          title="Delete deck"
          body={`Delete “${dialog.deck.name}”? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setDialog(null)}
          onConfirm={() => {
            deleteDeck(dialog.deck.id);
            setDialog(null);
          }}
        />
      )}
    </div>
  );
}
