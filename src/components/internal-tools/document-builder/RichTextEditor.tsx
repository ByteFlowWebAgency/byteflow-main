'use client';

import { useEffect, useRef } from 'react';
import styles from './editor.module.css';
import { sanitizeRichHtml } from '@/lib/document-builder/sanitize';

interface RichTextEditorProps {
  html: string;
  onChange: (html: string) => void;
  ariaLabel: string;
  /** Extra class for the editable surface (so callout vs prose keep their look). */
  surfaceClassName?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split('\n')
    .map((line) => `<p>${line || '<br>'}</p>`)
    .join('');
}

/**
 * Rich-text block editor. Dependency-free: native contentEditable + the (deprecated but
 * universally supported) execCommand for the fixed feature set — bold, italic, link,
 * bullet + numbered lists — chosen over adding Tiptap for so small a surface (justified in
 * HANDOFF). Uncontrolled: innerHTML is seeded once on mount and never rewritten from props
 * (which would jump the caret); edits flow OUT, sanitized on every input/paste/blur. The
 * caller remounts (via React key) when the underlying block identity changes.
 */
export default function RichTextEditor({
  html,
  onChange,
  ariaLabel,
  surfaceClassName,
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = html || '<p></p>';
    try {
      // Prefer semantic <b>/<i> (which the sanitizer maps to strong/em) over styled spans.
      document.execCommand('styleWithCSS', false, 'false');
    } catch {
      /* older engines: ignore */
    }
    // Mount-only: never re-seed from props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function push() {
    if (ref.current) onChange(sanitizeRichHtml(ref.current.innerHTML));
  }

  function cmd(command: string, value?: string) {
    ref.current?.focus();
    document.execCommand(command, false, value);
    push();
  }

  function onPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pastedHtml = e.clipboardData.getData('text/html');
    const pastedText = e.clipboardData.getData('text/plain');
    const clean = sanitizeRichHtml(pastedHtml || escapeHtml(pastedText));
    document.execCommand('insertHTML', false, clean);
    push();
  }

  function addLink() {
    const url = window.prompt('Link URL (https://…)');
    if (url) cmd('createLink', url.trim());
  }

  // Keep focus in the editable when a toolbar button is pressed.
  const hold = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    fn();
  };

  return (
    <div className={styles.rte}>
      <div className={styles.rteToolbar} role="toolbar" aria-label="Text formatting">
        <button type="button" onMouseDown={hold(() => cmd('bold'))} aria-label="Bold" title="Bold">
          <b>B</b>
        </button>
        <button type="button" onMouseDown={hold(() => cmd('italic'))} aria-label="Italic" title="Italic">
          <i>I</i>
        </button>
        <button type="button" onMouseDown={hold(addLink)} aria-label="Add link" title="Link">
          🔗
        </button>
        <button
          type="button"
          onMouseDown={hold(() => cmd('insertUnorderedList'))}
          aria-label="Bulleted list"
          title="Bulleted list"
        >
          • List
        </button>
        <button
          type="button"
          onMouseDown={hold(() => cmd('insertOrderedList'))}
          aria-label="Numbered list"
          title="Numbered list"
        >
          1. List
        </button>
      </div>
      <div
        ref={ref}
        className={`${styles.rteArea} ${surfaceClassName ?? ''}`}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        onInput={push}
        onBlur={push}
        onPaste={onPaste}
        suppressContentEditableWarning
      />
    </div>
  );
}
