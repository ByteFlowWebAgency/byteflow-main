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
import { formatDisplayDate } from '@/lib/internal-tools/format';
import type { EditorAction } from './editorState';
import type { Theme } from '../themes/themeTypes';
import type { DocumentPage } from '@/lib/document-builder/types';

interface EditorCanvasProps {
  page: DocumentPage;
  theme: Theme;
  dispatch: (action: EditorAction) => void;
}

/** Center canvas: the selected page rendered through ThemedDocument, edited in place. */
export default function EditorCanvas({ page, theme, dispatch }: EditorCanvasProps) {
  return (
    <div className={styles.canvas}>
      <div className={styles.canvasInner}>
        <ThemedDocument theme={theme}>
          {page.kind === 'cover' && <EditableCover page={page} theme={theme} dispatch={dispatch} />}
          {page.kind === 'sectionTitle' && (
            <EditableSection page={page} theme={theme} dispatch={dispatch} />
          )}
          {(page.kind === 'content' || page.kind === 'closing') && (
            <EditableContent page={page} dispatch={dispatch} />
          )}
        </ThemedDocument>
      </div>
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
          <input
            type="date"
            className={styles.coverDateInput}
            value={(f.date ?? '').slice(0, 10)}
            onChange={(e) => set({ date: e.target.value })}
            aria-label="Cover date"
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
  dispatch,
}: {
  page: DocumentPage;
  dispatch: (a: EditorAction) => void;
}) {
  return (
    <section className={builder.sheet}>
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
