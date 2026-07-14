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

// Comfortable canvas size range — the width var lib/slides/pptxGenerators.ts's proportions
// were designed around (960px), down to a minimum that keeps text legible when both side
// panels are open on a narrower window.
const MAX_CANVAS_W = 960;
const MIN_CANVAS_W = 420;

export default function DeckEditorApp({ id }: { id: string }) {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [railOpen, setRailOpen] = useState(true);
  const [fieldPanelOpen, setFieldPanelOpen] = useState(true);
  const [canvasW, setCanvasW] = useState(MAX_CANVAS_W);
  const [editorHeight, setEditorHeight] = useState<number | null>(null);
  const firstRun = useRef(true);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDeck(getDeck(id) ?? null);
    setLoaded(true);
  }, [id]);

  // Fill exactly the space between this element's top (below the shell's sticky header)
  // and the shared footer, measured directly rather than guessed via `calc(100vh -
  // <magic number>)` — see the comment on .editor in DeckEditor.module.css for why a
  // guessed constant caused both an outer page scrollbar and the rail/field-panel's
  // internal scrollbars fighting each other.
  //
  // Depends on `deck` (not `[]`): before the deck finishes loading, this component
  // returns the "Loading…" placeholder instead of the real editor, so `editorRef` isn't
  // attached to anything yet on the very first commit. An effect with an empty
  // dependency array runs exactly once, on that first commit, and never gets a second
  // chance once the real editor (and the ref) exist — it would silently no-op forever.
  useEffect(() => {
    function measure() {
      const el = editorRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      const footer = document.querySelector('footer');
      const footerH = footer ? footer.getBoundingClientRect().height : 0;
      const available = window.innerHeight - top - footerH;
      setEditorHeight(Math.max(400, Math.round(available)));
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [deck]);

  // The canvas has a fixed intrinsic width (see slideCanvas.module.css — ThemedDocument's
  // `width: fit-content` wrapper gives a plain `width: 100%` nothing to resolve against),
  // so it doesn't shrink with its flex container on its own. Measure the actual available
  // space whenever it changes — window resize, or either side panel opening/closing — and
  // clamp the canvas to fit it, instead of letting it overflow underneath the field panel.
  useEffect(() => {
    const el = canvasAreaRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? el.clientWidth;
      const next = Math.round(Math.min(MAX_CANVAS_W, Math.max(MIN_CANVAS_W, width - 8)));
      setCanvasW(next);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [railOpen, fieldPanelOpen]);

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
    <div
      className={`bfScope ${styles.editor}`}
      ref={editorRef}
      style={editorHeight ? { height: editorHeight } : undefined}
    >
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          <Link href="/internal/slides" className={styles.backLink}>
            ← Decks
          </Link>
          <button
            type="button"
            className={`${styles.panelToggle} ${railOpen ? styles.panelToggleActive : ''}`}
            onClick={() => setRailOpen((v) => !v)}
            aria-pressed={railOpen}
            aria-label={railOpen ? 'Hide slide list' : 'Show slide list'}
            title={railOpen ? 'Hide slide list' : 'Show slide list'}
          >
            ☰ Slides
          </button>
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
          <button
            type="button"
            className={`${styles.panelToggle} ${fieldPanelOpen ? styles.panelToggleActive : ''}`}
            onClick={() => setFieldPanelOpen((v) => !v)}
            aria-pressed={fieldPanelOpen}
            aria-label={fieldPanelOpen ? 'Hide content panel' : 'Show content panel'}
            title={fieldPanelOpen ? 'Hide content panel' : 'Show content panel'}
          >
            Content ☰
          </button>
          <button type="button" className={styles.primaryBtn} onClick={onDownload} disabled={downloading}>
            {downloading ? 'Preparing…' : 'Download .pptx'}
          </button>
        </div>
      </header>

      <div className={styles.workarea}>
        {railOpen && (
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
        )}

        <div className={styles.canvasArea} ref={canvasAreaRef}>
          <div className={styles.canvasWrap} style={{ ['--bf-slide-w' as string]: `${canvasW}px` }}>
            <SlideRenderer slide={slide} theme={theme} />
          </div>
        </div>

        {fieldPanelOpen && (
          <div className={styles.fieldPanel}>
            <p className={styles.fieldPanelHeading}>{TEMPLATE_LABELS[slide.templateId].name} — content</p>
            <SlideFieldEditor slide={slide} onChange={(next) => updateSlide(safeIndex, next)} />
          </div>
        )}
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
