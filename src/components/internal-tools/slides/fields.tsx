'use client';

// Shared field-editing primitives for the deck editor's field panel — plain text/textarea/
// image inputs and a generic repeatable-list editor, reused across all 25 templates'
// SlideFieldEditor forms. No rich text, no freeform positioning, per
// docs/slides/00-GUARDRAILS.md.

import { useRef } from 'react';
import styles from './fields.module.css';
import BackgroundDesignPicker from '@/components/background-designs/BackgroundDesignPicker';

let idCounter = 0;
function useStableId(prefix: string): string {
  const ref = useRef<string>(undefined);
  if (!ref.current) ref.current = `${prefix}-${++idCounter}`;
  return ref.current;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const id = useStableId('field');
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        className={styles.input}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/** Only used by the three full-bleed-eligible templates (titleCover/sectionDivider/
 * thankYouClosing) — every other template's form has no equivalent field. */
export function BackgroundDesignField({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (designId: string | undefined) => void;
}) {
  const id = useStableId('field');
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        Background design
      </label>
      <BackgroundDesignPicker id={id} value={value} onChange={onChange} className={styles.input} />
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const id = useStableId('field');
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <textarea
        id={id}
        className={styles.textarea}
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const id = useStableId('field');
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        className={styles.input}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useStableId('img');

  function onFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.imageField}>
        <div
          className={styles.imagePreview}
          style={value ? { backgroundImage: `url(${value})` } : undefined}
        />
        <div className={styles.imageActions}>
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <button type="button" className={styles.fileButton} onClick={() => inputRef.current?.click()}>
            {value ? 'Replace image' : 'Upload image'}
          </button>
          {value && (
            <button type="button" className={styles.removeLink} onClick={() => onChange('')}>
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Repeatable list of plain strings — add/remove/reorder, no per-item extra fields. */
export function StringListField({
  label,
  items,
  onChange,
  min = 0,
  max = Infinity,
  itemPlaceholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  min?: number;
  max?: number;
  itemPlaceholder?: string;
}) {
  function update(i: number, value: string) {
    const next = [...items];
    next[i] = value;
    onChange(next);
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  function add() {
    onChange([...items, '']);
  }

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      {items.map((item, i) => (
        <ListRow key={i} onUp={() => move(i, -1)} onDown={() => move(i, 1)} onRemove={() => remove(i)} canUp={i > 0} canDown={i < items.length - 1} canRemove={items.length > min}>
          <input
            type="text"
            className={styles.input}
            value={item}
            placeholder={itemPlaceholder}
            onChange={(e) => update(i, e.target.value)}
          />
        </ListRow>
      ))}
      <button type="button" className={styles.addButton} onClick={add} disabled={items.length >= max}>
        + Add
      </button>
    </div>
  );
}

/** One row inside a repeatable list, with up/down/remove controls. */
export function ListRow({
  children,
  onUp,
  onDown,
  onRemove,
  canUp,
  canDown,
  canRemove,
}: {
  children: React.ReactNode;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
  canUp: boolean;
  canDown: boolean;
  canRemove: boolean;
}) {
  return (
    <div className={styles.listItem}>
      <div className={styles.listItemBody}>{children}</div>
      <div className={styles.listItemControls}>
        <button type="button" className={styles.iconButton} onClick={onUp} disabled={!canUp} aria-label="Move up" title="Move up">
          ↑
        </button>
        <button type="button" className={styles.iconButton} onClick={onDown} disabled={!canDown} aria-label="Move down" title="Move down">
          ↓
        </button>
      </div>
      <button
        type="button"
        className={styles.iconButton}
        onClick={onRemove}
        disabled={!canRemove}
        aria-label="Remove"
        title="Remove"
      >
        ✕
      </button>
    </div>
  );
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return <p className={styles.sectionHeading}>{children}</p>;
}

export function Hint({ children }: { children: React.ReactNode }) {
  return <p className={styles.hint}>{children}</p>;
}

/**
 * Generic list-of-objects editor: renders one ListRow per item via `renderItem`, plus
 * add/remove/reorder wired against the item array. `makeNew` creates a fresh item (with
 * its own id) when "+ Add" is clicked.
 */
export function ObjectListField<T>({
  label,
  items,
  onChange,
  renderItem,
  makeNew,
  min = 0,
  max = Infinity,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, update: (patch: Partial<T>) => void) => React.ReactNode;
  makeNew: () => T;
  min?: number;
  max?: number;
}) {
  function updateAt(i: number, patch: Partial<T>) {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  function add() {
    onChange([...items, makeNew()]);
  }

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      {items.map((item, i) => (
        <ListRow
          key={i}
          onUp={() => move(i, -1)}
          onDown={() => move(i, 1)}
          onRemove={() => remove(i)}
          canUp={i > 0}
          canDown={i < items.length - 1}
          canRemove={items.length > min}
        >
          {renderItem(item, (patch) => updateAt(i, patch))}
        </ListRow>
      ))}
      <button type="button" className={styles.addButton} onClick={add} disabled={items.length >= max}>
        + Add
      </button>
    </div>
  );
}
