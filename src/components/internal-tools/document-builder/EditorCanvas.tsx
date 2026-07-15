'use client';

import { Fragment } from 'react';
import Image from 'next/image';
import styles from './editor.module.css';
import builder from './builder.module.css';
import coverStyles from '../themes/CoverPage.module.css';
import sectionStyles from './SectionTitlePage.module.css';
import ThemedDocument from '../themes/ThemedDocument';
import BlockEditor from './BlockEditor';
import PlainTextEditable from './PlainTextEditable';
import InsertBlockControl from './InsertBlockControl';
import BackgroundLayer from '@/components/background-designs/BackgroundLayer';
import BackgroundDesignPicker from '@/components/background-designs/BackgroundDesignPicker';
import ThemeOverridePicker from '../themes/ThemeOverridePicker';
import { resolveEffectiveTheme } from '../themes/themeStorage';
import type { EditorAction } from './editorState';
import type { Theme } from '../themes/themeTypes';
import type { DocumentPage } from '@/lib/document-builder/types';

interface EditorCanvasProps {
  page: DocumentPage;
  theme: Theme;
  dispatch: (action: EditorAction) => void;
}

/** Center canvas: the selected page rendered through ThemedDocument, edited in place.
 * Every page kind (not just cover/sectionTitle) can carry its own background design and
 * theme override — the toolbar above the page applies uniformly. */
export default function EditorCanvas({ page, theme: docTheme, dispatch }: EditorCanvasProps) {
  const { theme, missing } = resolveEffectiveTheme(page.themeId, docTheme);

  function setPageMeta(patch: { backgroundDesignId?: string } | { themeId?: string }) {
    dispatch({
      t: 'updatePageMeta',
      pageId: page.id,
      backgroundDesignId: page.backgroundDesignId,
      themeId: page.themeId,
      ...patch,
    });
  }

  return (
    <div className={styles.canvas}>
      <div className={styles.canvasInner} style={{ flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <PageDesignToolbar
          backgroundDesignId={page.backgroundDesignId}
          themeId={page.themeId}
          themeMissing={missing}
          onBackgroundChange={(backgroundDesignId) => setPageMeta({ backgroundDesignId })}
          onThemeChange={(themeId) => setPageMeta({ themeId })}
        />
        <ThemedDocument theme={theme}>
          {page.kind === 'cover' && <EditableCover page={page} theme={theme} dispatch={dispatch} />}
          {page.kind === 'sectionTitle' && (
            <EditableSection page={page} theme={theme} dispatch={dispatch} />
          )}
          {(page.kind === 'content' || page.kind === 'closing') && (
            <EditableContent page={page} theme={theme} dispatch={dispatch} />
          )}
        </ThemedDocument>
      </div>
    </div>
  );
}

/** Lives per-page (not in the document-level top bar next to the document's own theme
 * picker) — a document can carry a different design/theme on its cover than on a
 * section-title or content page elsewhere in the same document. */
function PageDesignToolbar({
  backgroundDesignId,
  themeId,
  themeMissing,
  onBackgroundChange,
  onThemeChange,
}: {
  backgroundDesignId: string | undefined;
  themeId: string | undefined;
  themeMissing: boolean;
  onBackgroundChange: (designId: string | undefined) => void;
  onThemeChange: (themeId: string | undefined) => void;
}) {
  return (
    <div className={styles.pageToolbar}>
      <span className={styles.pageToolbarLabel}>Background design</span>
      <BackgroundDesignPicker
        id="page-bg-design"
        value={backgroundDesignId}
        onChange={onBackgroundChange}
        className={styles.pageToolbarSelect}
      />
      <span className={styles.pageToolbarLabel}>Theme override</span>
      <ThemeOverridePicker
        id="page-theme-override"
        value={themeId}
        missing={themeMissing}
        onChange={onThemeChange}
        className={styles.pageToolbarSelect}
      />
    </div>
  );
}

function EditableCover({
  page,
  theme,
  dispatch,
}: {
  page: DocumentPage;
  theme: Theme;
  dispatch: (a: EditorAction) => void;
}) {
  const f = page.coverFields ?? { title: '' };
  const set = (fields: Partial<typeof f>) =>
    dispatch({ t: 'updateCoverFields', pageId: page.id, fields });
  return (
    <section className={`${coverStyles.cover} ${theme.coverPage.fullBleedBackground ? coverStyles.fullBleed : ''}`}>
      <BackgroundLayer designId={page.backgroundDesignId} theme={theme} width={816} height={1056} />
      <header className={coverStyles.top}>
        <Image src="/BYTEFLOW_LOGO.png" alt="ByteFlow Solutions" width={200} height={196} unoptimized className={coverStyles.logo} />
      </header>
      <div className={coverStyles.main}>
        <PlainTextEditable
          value={f.subtitle ?? ''}
          onChange={(subtitle) => set({ subtitle })}
          className={coverStyles.label}
          placeholder="EYEBROW / SUBTITLE"
          ariaLabel="Cover eyebrow"
        />
        <PlainTextEditable
          as="h1"
          value={f.title}
          onChange={(title) => set({ title })}
          className={coverStyles.title}
          placeholder="Document title"
          ariaLabel="Cover title"
        />
        <p className={coverStyles.client}>
          Prepared for{' '}
          <PlainTextEditable
            as="span"
            value={f.clientName ?? ''}
            onChange={(clientName) => set({ clientName })}
            className={coverStyles.clientName}
            placeholder="Client name"
            ariaLabel="Client name"
          />
        </p>
      </div>
      <footer className={coverStyles.footer}>
        <div className={coverStyles.keyline} aria-hidden />
        <div className={coverStyles.footerRow}>
          {/* Paper is always light regardless of the chrome dark/light toggle, so this
              pins color-scheme locally rather than inheriting tokens.css's dark default. */}
          <input
            type="date"
            className={styles.coverDateInput}
            value={(f.date ?? '').slice(0, 10)}
            onChange={(e) => set({ date: e.target.value })}
            aria-label="Cover date"
            style={{ colorScheme: 'light' }}
          />
          <p className={coverStyles.brand}>ByteFlow Solutions · Akron, Ohio</p>
        </div>
      </footer>
    </section>
  );
}

function EditableSection({
  page,
  theme,
  dispatch,
}: {
  page: DocumentPage;
  theme: Theme;
  dispatch: (a: EditorAction) => void;
}) {
  const f = page.sectionTitleFields ?? { title: '' };
  const set = (fields: Partial<typeof f>) =>
    dispatch({ t: 'updateSectionFields', pageId: page.id, fields });
  return (
    <section className={`${sectionStyles.section} ${theme.coverPage.fullBleedBackground ? sectionStyles.fullBleed : ''}`}>
      <BackgroundLayer designId={page.backgroundDesignId} theme={theme} width={816} height={1056} />
      <div className={sectionStyles.main}>
        <PlainTextEditable
          value={f.eyebrow ?? ''}
          onChange={(eyebrow) => set({ eyebrow })}
          className={sectionStyles.eyebrow}
          placeholder="EYEBROW (optional)"
          ariaLabel="Section eyebrow"
        />
        <PlainTextEditable
          as="h2"
          value={f.title}
          onChange={(title) => set({ title })}
          className={sectionStyles.title}
          placeholder="Section title"
          ariaLabel="Section title"
        />
        <PlainTextEditable
          value={f.subtitle ?? ''}
          onChange={(subtitle) => set({ subtitle })}
          className={sectionStyles.subtitle}
          placeholder="Subtitle (optional)"
          ariaLabel="Section subtitle"
        />
        <div className={sectionStyles.rule} aria-hidden />
      </div>
    </section>
  );
}

function EditableContent({
  page,
  theme,
  dispatch,
}: {
  page: DocumentPage;
  theme: Theme;
  dispatch: (a: EditorAction) => void;
}) {
  return (
    <section className={builder.sheet}>
      <BackgroundLayer designId={page.backgroundDesignId} theme={theme} width={816} height={1056} />
      <div className={builder.blocks}>
        <InsertBlockControl onInsert={(blockType) => dispatch({ t: 'addBlock', pageId: page.id, blockType, at: 0 })} />
        {page.blocks.map((block, index) => (
          <Fragment key={block.id}>
            <BlockEditor
              block={block}
              onChange={(b) => dispatch({ t: 'updateBlock', pageId: page.id, block: b })}
              onMove={(dir) => dispatch({ t: 'moveBlock', pageId: page.id, index, dir })}
              onDuplicate={() => dispatch({ t: 'duplicateBlock', pageId: page.id, index })}
              onDelete={() => dispatch({ t: 'deleteBlock', pageId: page.id, index })}
              isFirst={index === 0}
              isLast={index === page.blocks.length - 1}
            />
            <InsertBlockControl
              onInsert={(blockType) => dispatch({ t: 'addBlock', pageId: page.id, blockType, at: index + 1 })}
            />
          </Fragment>
        ))}
      </div>
      {page.kind === 'closing' && (
        <footer className={builder.closingFooter}>
          <div className={builder.footerKeyline} aria-hidden />
          <div className={builder.footerRow}>
            <span>Let’s talk about next steps.</span>
            <span className={builder.footerBrand}>ByteFlow Solutions · Akron, Ohio</span>
          </div>
        </footer>
      )}
    </section>
  );
}
