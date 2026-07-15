'use client';

import { useEffect, useRef, type ElementType } from 'react';
import styles from './editor.module.css';

interface PlainTextEditableProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
  /** Element to render (default span). Use the visual tag so editing is WYSIWYG. */
  as?: ElementType;
}

/**
 * Uncontrolled single-value contentEditable for plain text (headings, banner/cover/section
 * fields, table + key-value cells). Seeds textContent on mount, pushes textContent out on
 * input/blur, and never re-seeds from props (which would jump the caret); the caller
 * remounts via key when identity changes. Enter is swallowed so a plain field stays one
 * logical value.
 */
export default function PlainTextEditable({
  value,
  onChange,
  ariaLabel,
  placeholder,
  className,
  as,
}: PlainTextEditableProps) {
  const Tag = (as ?? 'span') as ElementType;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.textContent = value;
    // Mount-only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function push() {
    if (ref.current) onChange(ref.current.textContent ?? '');
  }

  return (
    <Tag
      ref={ref}
      className={`${styles.plainEditable} ${className ?? ''}`}
      contentEditable
      role="textbox"
      aria-label={ariaLabel}
      data-placeholder={placeholder ?? ''}
      spellCheck
      suppressContentEditableWarning
      onInput={push}
      onBlur={push}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
      }}
    />
  );
}
