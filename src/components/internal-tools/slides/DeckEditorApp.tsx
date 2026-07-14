'use client';

// The deck editor: top bar (name/theme/autosave/download/back), slide rail, and a canvas
// (live themed preview + a field-editing panel) — per docs/slides/03-EDITOR-SCREEN.md.

import '@/components/internal-tools/tokens.css';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './DeckEditor.module.css';
import SlideRail from './SlideRail';
import SlideRenderer from './SlideRenderer';
import SlideFieldEditor from './SlideFieldEditor';
import SlideTemplatePicker from './SlideTemplatePicker';
import ConfirmDialog from '@/components/internal-tools/ConfirmDialog';
import ThemePicker from '@/components/internal-tools/themes/ThemePicker';
import { resolveTheme } from '@/components/internal-tools/themes/themeStorage';
import { getDeck, saveDeck } from '@/lib/slides/storage';
import { cloneSlideFresh, createSlide } from '@/lib/slides/defaults';
import { downloadDeckPptx } from '@/lib/slides/pptxExport';
import { TEMPLATE_LABELS } from '@/lib/slides/templateLabels';
import type { Deck, Slide, SlideTemplateId } from '@/lib/slides/types';

type SaveStatus = 'saved' | 'saving' | 'error';

export default function DeckEditorApp({ id }: { id: string }) {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const firstRun = useRef(true);

  useEffect(() => {
    setDeck(getDeck(id) ?? null);
    setLoaded(true);
  }, [id]);

  // Debounced autosave on every change — never on the initial load.
  useEffect(() => {
    if (!deck) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setStatus('saving');
    const handle = setTimeout(() => {
      const result = saveDeck(deck);
      setStatus(result.ok ? 'saved' : 'error');
    }, 600);
    return () => clearTimeout(handle);
  }, [deck]);

  if (loaded && !deck) {
    return (
      <div className={styles.notFound}>
        <p>That deck could not be found.</p>
        <Link href="/internal/slides" className={styles.backLink}>
          ← Back to decks
        </Link>
      </div>
    );
  }
  if (!deck) return <div className={styles.notFound}>Loading…</div>;

  const { theme, missing } = resolveTheme(deck.themeId);
  const safeIndex = Math.min(selectedIndex, deck.slides.length - 1);
  const slide = deck.slides[safeIndex];

  function patchDeck(patch: Partial<Deck>) {
    setDeck((d) => (d ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d));
  }

  function updateSlide(index: number, next: Slide) {
    setDeck((d) => {
      if (!d) return d;
      const slides = [...d.slides];
      slides[index] = next;
      return { ...d, slides, updatedAt: new Date().toISOString() };
    });
  }

  function addSlide(templateId: SlideTemplateId) {
    setDeck((d) => {
      if (!d) return d;
      const slides = [...d.slides, createSlide(templateId)];
      setSelectedIndex(slides.length - 1);
      return { ...d, slides, updatedAt: new Date().toISOString() };
    });
    setPickerOpen(false);
  }

  function reorderSlide(index: number, dir: -1 | 1) {
    setDeck((d) => {
      if (!d) return d;
      const j = index + dir;
      if (j < 0 || j >= d.slides.length) return d;
      const slides = [...d.slides];
      [slides[index], slides[j]] = [slides[j], slides[index]];
      if (selectedIndex === index) setSelectedIndex(j);
      else if (selectedIndex === j) setSelectedIndex(index);
      return { ...d, slides, updatedAt: new Date().toISOString() };
    });
  }

  function duplicateSlide(index: number) {
    setDeck((d) => {
      if (!d) return d;
      const copy = cloneSlideFresh(d.slides[index]);
      const slides = [...d.slides];
      slides.splice(index + 1, 0, copy);
      setSelectedIndex(index + 1);
      return { ...d, slides, updatedAt: new Date().toISOString() };
    });
  }

  function deleteSlide(index: number) {
    setDeck((d) => {
      if (!d || d.slides.length <= 1) return d;
      const slides = d.slides.filter((_, i) => i !== index);
      setSelectedIndex((current) => Math.min(current, slides.length - 1));
      return { ...d, slides, updatedAt: new Date().toISOString() };
    });
  }

  async function onDownload() {
    if (!deck) return;
    setDownloading(true);
    try {
      await downloadDeckPptx(deck, theme);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className={`bfScope ${styles.editor}`}>
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          <Link href="/internal/slides" className={styles.backLink}>
            ← Decks
          </Link>
          <input
            className={styles.deckName}
            value={deck.name}
            onChange={(e) => patchDeck({ name: e.target.value })}
            aria-label="Deck name"
          />
          <ThemePicker
            id="slide-theme-picker"
            value={deck.themeId}
            missing={missing}
            onChange={(themeId) => patchDeck({ themeId })}
          />
        </div>
        <div className={styles.topRight}>
          <span className={`${styles.saveStatus} ${styles[`status_${status}`]}`} role="status">
            {status === 'saved' ? 'Saved' : status === 'saving' ? 'Saving…' : 'Save failed'}
          </span>
          <button type="button" className={styles.primaryBtn} onClick={onDownload} disabled={downloading}>
            {downloading ? 'Preparing…' : 'Download .pptx'}
          </button>
        </div>
      </header>

      <div className={styles.workarea}>
        <div className={styles.railSticky}>
          <SlideRail
            slides={deck.slides}
            selectedIndex={safeIndex}
            onSelect={setSelectedIndex}
            onReorder={reorderSlide}
            onDuplicate={duplicateSlide}
            onRequestDelete={setDeleting}
            onAddClick={() => setPickerOpen(true)}
          />
        </div>

        <div className={styles.canvasArea}>
          <div className={styles.canvasWrap}>
            <SlideRenderer slide={slide} theme={theme} />
          </div>
        </div>

        <div className={styles.fieldPanel}>
          <p className={styles.fieldPanelHeading}>{TEMPLATE_LABELS[slide.templateId].name} — content</p>
          <SlideFieldEditor slide={slide} onChange={(next) => updateSlide(safeIndex, next)} />
        </div>
      </div>

      {pickerOpen && <SlideTemplatePicker onPick={addSlide} onClose={() => setPickerOpen(false)} />}

      {/* Rendered here, not inside SlideRail — see SlideRail.tsx's comment: the rail sits
          under a `position: sticky` wrapper, which unconditionally creates a stacking
          context that would trap this fixed-position dialog's z-index, painting it beneath
          the canvas despite correct viewport positioning. */}
      {deleting !== null && (
        <ConfirmDialog
          title="Delete slide?"
          body={`Delete slide ${deleting + 1} (${TEMPLATE_LABELS[deck.slides[deleting].templateId].name})? This can't be undone.`}
          confirmLabel="Delete slide"
          danger
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            deleteSlide(deleting);
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}
