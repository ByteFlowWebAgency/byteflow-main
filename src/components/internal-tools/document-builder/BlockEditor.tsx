'use client';

import { useRef } from 'react';
import styles from './editor.module.css';
import builder from './builder.module.css';
import RichTextEditor from './RichTextEditor';
import PlainTextEditable from './PlainTextEditable';
import { newId } from '@/lib/document-builder/defaults';
import { formatUsd } from '@/lib/internal-tools/format';
import type { Block, PricingTableBlock } from '@/lib/document-builder/types';
import type { Pricing } from '@/lib/internal-tools/pricing';

interface BlockEditorProps {
  block: Block;
  onChange: (block: Block) => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function BlockEditor({
  block,
  onChange,
  onMove,
  onDuplicate,
  onDelete,
  isFirst,
  isLast,
}: BlockEditorProps) {
  return (
    <div className={styles.blockWrap} data-block-type={block.type}>
      <div className={styles.blockToolbar} role="toolbar" aria-label={`${block.type} block controls`}>
        <button type="button" onClick={() => onMove(-1)} disabled={isFirst} aria-label="Move up" title="Move up">
          ↑
        </button>
        <button type="button" onClick={() => onMove(1)} disabled={isLast} aria-label="Move down" title="Move down">
          ↓
        </button>
        <BlockSettings block={block} onChange={onChange} />
        <button type="button" onClick={onDuplicate} aria-label="Duplicate block" title="Duplicate">
          ⧉
        </button>
        <button type="button" onClick={onDelete} className={styles.blockDelete} aria-label="Delete block" title="Delete">
          ✕
        </button>
      </div>
      <div className={styles.blockBody}>
        <BlockBody block={block} onChange={onChange} />
      </div>
    </div>
  );
}

/** Per-block settings that live in the toolbar (heading level, image width, etc.). */
function BlockSettings({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  switch (block.type) {
    case 'heading':
      return (
        <span className={styles.settingsGroup}>
          {([1, 2, 3] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              className={block.level === lvl ? styles.settingOn : ''}
              onClick={() => onChange({ ...block, level: lvl })}
              aria-pressed={block.level === lvl}
              title={`Heading level ${lvl}`}
            >
              H{lvl}
            </button>
          ))}
        </span>
      );
    case 'image':
      return (
        <span className={styles.settingsGroup}>
          {(['full', 'half'] as const).map((w) => (
            <button
              key={w}
              type="button"
              className={block.width === w ? styles.settingOn : ''}
              onClick={() => onChange({ ...block, width: w })}
              aria-pressed={block.width === w}
            >
              {w}
            </button>
          ))}
        </span>
      );
    case 'spacer':
      return (
        <span className={styles.settingsGroup}>
          {(['small', 'medium', 'large'] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={block.size === s ? styles.settingOn : ''}
              onClick={() => onChange({ ...block, size: s })}
              aria-pressed={block.size === s}
            >
              {s[0].toUpperCase()}
            </button>
          ))}
        </span>
      );
    default:
      return null;
  }
}

function BlockBody({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  switch (block.type) {
    case 'heading': {
      const cls = block.level === 1 ? builder.h1 : block.level === 3 ? builder.h3 : builder.h2;
      return (
        <PlainTextEditable
          key={`${block.id}-${block.level}`}
          as={`h${block.level}` as 'h2'}
          value={block.text}
          onChange={(text) => onChange({ ...block, text })}
          className={cls}
          placeholder="Heading"
          ariaLabel="Heading text"
        />
      );
    }
    case 'titleBanner':
      return (
        <div className={builder.banner}>
          <PlainTextEditable
            value={block.eyebrow ?? ''}
            onChange={(eyebrow) => onChange({ ...block, eyebrow })}
            className={builder.bannerEyebrow}
            placeholder="EYEBROW (optional)"
            ariaLabel="Banner eyebrow"
          />
          <PlainTextEditable
            value={block.title}
            onChange={(title) => onChange({ ...block, title })}
            className={builder.bannerTitle}
            placeholder="Section title"
            ariaLabel="Banner title"
          />
          <PlainTextEditable
            value={block.subtitle ?? ''}
            onChange={(subtitle) => onChange({ ...block, subtitle })}
            className={builder.bannerSubtitle}
            placeholder="Subtitle (optional)"
            ariaLabel="Banner subtitle"
          />
          <div className={builder.bannerRule} aria-hidden />
        </div>
      );
    case 'richText':
      return (
        <RichTextEditor
          key={block.id}
          html={block.html}
          onChange={(html) => onChange({ ...block, html })}
          ariaLabel="Text block"
          surfaceClassName={builder.prose}
        />
      );
    case 'callout':
      return (
        <RichTextEditor
          key={block.id}
          html={block.html}
          onChange={(html) => onChange({ ...block, html })}
          ariaLabel="Callout"
          surfaceClassName={builder.callout}
        />
      );
    case 'image':
      return <ImageEditor block={block} onChange={onChange} />;
    case 'table':
      return <TableEditor block={block} onChange={onChange} />;
    case 'keyValueList':
      return <KeyValueEditor block={block} onChange={onChange} />;
    case 'pricingTable':
      return <PricingEditor block={block} onChange={onChange} />;
    case 'divider':
      return <hr className={builder.divider} />;
    case 'spacer':
      return (
        <div className={styles.spacerHint} aria-hidden>
          Spacer ({block.size})
        </div>
      );
    case 'pageBreak':
      return <div className={styles.pageBreakHint}>— Page break —</div>;
    default: {
      const never: never = block;
      return <>{String(never)}</>;
    }
  }
}

// ---- image ------------------------------------------------------------------------------

function ImageEditor({
  block,
  onChange,
}: {
  block: Extract<Block, { type: 'image' }>;
  onChange: (b: Block) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  function pick(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange({ ...block, dataUrl: String(reader.result) });
    reader.readAsDataURL(file);
  }
  return (
    <div className={styles.imageEditor}>
      {block.dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- data: URL preview
        <img src={block.dataUrl} alt="" className={block.width === 'half' ? builder.figureHalf : ''} style={{ maxWidth: '100%', borderRadius: 6 }} />
      ) : (
        <div className={builder.imagePlaceholder}>No image selected</div>
      )}
      <div className={styles.imageControls}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className={styles.fileInput}
          onChange={(e) => pick(e.target.files?.[0])}
          aria-label="Choose image file"
        />
        <input
          type="text"
          value={block.caption ?? ''}
          onChange={(e) => onChange({ ...block, caption: e.target.value })}
          placeholder="Caption (optional)"
          aria-label="Image caption"
          className={styles.textInput}
        />
      </div>
    </div>
  );
}

// ---- table ------------------------------------------------------------------------------

function TableEditor({
  block,
  onChange,
}: {
  block: Extract<Block, { type: 'table' }>;
  onChange: (b: Block) => void;
}) {
  const cols = block.header.length;
  const setHeader = (i: number, v: string) => {
    const header = [...block.header];
    header[i] = v;
    onChange({ ...block, header });
  };
  const setCell = (r: number, c: number, v: string) => {
    const rows = block.rows.map((row) => [...row]);
    rows[r][c] = v;
    onChange({ ...block, rows });
  };
  const addRow = () => onChange({ ...block, rows: [...block.rows, Array(cols).fill('')] });
  const removeRow = () => block.rows.length > 1 && onChange({ ...block, rows: block.rows.slice(0, -1) });
  const addCol = () =>
    onChange({
      ...block,
      header: [...block.header, `Column ${cols + 1}`],
      rows: block.rows.map((row) => [...row, '']),
    });
  const removeCol = () =>
    cols > 1 &&
    onChange({
      ...block,
      header: block.header.slice(0, -1),
      rows: block.rows.map((row) => row.slice(0, -1)),
    });

  return (
    <div>
      <table className={builder.table}>
        <thead>
          <tr>
            {block.header.map((cell, i) => (
              <th key={i}>
                <PlainTextEditable
                  key={`h-${i}-${cols}`}
                  value={cell}
                  onChange={(v) => setHeader(i, v)}
                  placeholder={`Column ${i + 1}`}
                  ariaLabel={`Column ${i + 1} header`}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c}>
                  <PlainTextEditable
                    key={`c-${r}-${c}-${cols}`}
                    value={cell}
                    onChange={(v) => setCell(r, c, v)}
                    placeholder="—"
                    ariaLabel={`Row ${r + 1} column ${c + 1}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.miniControls}>
        <button type="button" onClick={addRow}>+ Row</button>
        <button type="button" onClick={removeRow} disabled={block.rows.length <= 1}>− Row</button>
        <button type="button" onClick={addCol}>+ Col</button>
        <button type="button" onClick={removeCol} disabled={cols <= 1}>− Col</button>
      </div>
    </div>
  );
}

// ---- key/value --------------------------------------------------------------------------

function KeyValueEditor({
  block,
  onChange,
}: {
  block: Extract<Block, { type: 'keyValueList' }>;
  onChange: (b: Block) => void;
}) {
  const setItem = (id: string, patch: Partial<{ label: string; value: string }>) =>
    onChange({ ...block, items: block.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
  const add = () => onChange({ ...block, items: [...block.items, { id: newId(), label: 'Label', value: 'Value' }] });
  const remove = (id: string) => onChange({ ...block, items: block.items.filter((it) => it.id !== id) });

  return (
    <div className={styles.kvEditor}>
      {block.items.map((it) => (
        <div key={it.id} className={styles.kvEditorRow}>
          <input
            type="text"
            value={it.label}
            onChange={(e) => setItem(it.id, { label: e.target.value })}
            className={styles.textInput}
            aria-label="Key"
          />
          <input
            type="text"
            value={it.value}
            onChange={(e) => setItem(it.id, { value: e.target.value })}
            className={styles.textInput}
            aria-label="Value"
          />
          <button type="button" onClick={() => remove(it.id)} disabled={block.items.length <= 1} aria-label="Remove row">
            ✕
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className={styles.miniAdd}>
        + Add row
      </button>
    </div>
  );
}

// ---- pricing ----------------------------------------------------------------------------

function PricingEditor({
  block,
  onChange,
}: {
  block: PricingTableBlock;
  onChange: (b: Block) => void;
}) {
  const { pricing, lineItems } = block;
  const setPricing = (p: Pricing) => onChange({ ...block, pricing: p });
  const setModel = (model: Pricing['model']) => {
    if (model === 'flat') setPricing({ model: 'flat', totalAmount: 0, paymentSchedule: '' });
    else if (model === 'retainer')
      setPricing({ model: 'retainer', monthlyAmount: 0, termMonths: 12, includedScope: '' });
    else setPricing({ model: 'hybrid', setupAmount: 0, monthlyAmount: 0, termMonths: 12, includedScope: '' });
  };
  const setField = (patch: Record<string, unknown>) => setPricing({ ...pricing, ...patch } as Pricing);

  const addItem = () =>
    onChange({ ...block, lineItems: [...lineItems, { id: newId(), description: '', amount: 0, recurring: false }] });
  const setItem = (id: string, patch: Partial<{ description: string; amount: number; recurring: boolean }>) =>
    onChange({ ...block, lineItems: lineItems.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
  const removeItem = (id: string) => onChange({ ...block, lineItems: lineItems.filter((it) => it.id !== id) });

  return (
    <div className={styles.pricingEditor}>
      <div className={styles.pricingModels}>
        {(['flat', 'retainer', 'hybrid'] as const).map((m) => (
          <label key={m} className={styles.pricingModel}>
            <input type="radio" name={`model-${block.id}`} checked={pricing.model === m} onChange={() => setModel(m)} />
            {m}
          </label>
        ))}
      </div>

      <div className={styles.pricingFields}>
        {pricing.model === 'flat' && (
          <>
            <NumberField label="Project fee" value={pricing.totalAmount} onChange={(v) => setField({ totalAmount: v })} />
            <TextField label="Payment schedule" value={pricing.paymentSchedule} onChange={(v) => setField({ paymentSchedule: v })} />
          </>
        )}
        {pricing.model === 'retainer' && (
          <>
            <NumberField label="Monthly" value={pricing.monthlyAmount} onChange={(v) => setField({ monthlyAmount: v })} />
            <NumberField label="Term (months)" value={pricing.termMonths} onChange={(v) => setField({ termMonths: v })} />
            <TextField label="Included each month" value={pricing.includedScope} onChange={(v) => setField({ includedScope: v })} />
          </>
        )}
        {pricing.model === 'hybrid' && (
          <>
            <NumberField label="Setup" value={pricing.setupAmount} onChange={(v) => setField({ setupAmount: v })} />
            <NumberField label="Monthly" value={pricing.monthlyAmount} onChange={(v) => setField({ monthlyAmount: v })} />
            <NumberField label="Term (months)" value={pricing.termMonths} onChange={(v) => setField({ termMonths: v })} />
            <TextField label="Included each month" value={pricing.includedScope} onChange={(v) => setField({ includedScope: v })} />
          </>
        )}
      </div>

      <div className={styles.pricingItems}>
        <p className={styles.pricingItemsHead}>Line items</p>
        {lineItems.map((it) => (
          <div key={it.id} className={styles.pricingItemRow}>
            <input
              type="text"
              value={it.description}
              onChange={(e) => setItem(it.id, { description: e.target.value })}
              placeholder="Description"
              className={styles.textInput}
              aria-label="Line item description"
            />
            <input
              type="number"
              value={it.amount}
              onChange={(e) => setItem(it.id, { amount: Number(e.target.value) })}
              className={styles.numInput}
              aria-label="Line item amount"
            />
            <label className={styles.recurringLabel}>
              <input
                type="checkbox"
                checked={it.recurring}
                onChange={(e) => setItem(it.id, { recurring: e.target.checked })}
              />
              /mo
            </label>
            <button type="button" onClick={() => removeItem(it.id)} aria-label="Remove line item">
              ✕
            </button>
          </div>
        ))}
        <button type="button" onClick={addItem} className={styles.miniAdd}>
          + Add line item
        </button>
      </div>
      <p className={styles.pricingPreviewNote}>
        Amounts formatted as {formatUsd(1234.5)} in the document.
      </p>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={styles.numInput}
      />
    </label>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={styles.textInput} />
    </label>
  );
}
