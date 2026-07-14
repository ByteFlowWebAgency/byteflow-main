'use client';

// A bare <select> over the flat, ordered design registry (plus "None") — the one thing
// every integration point's picker shares. No wrapper/label markup here on purpose: each
// call site wraps it with its own local field/label styling so it fits its surrounding
// form conventions (document-builder's canvas toolbar vs. the slides field panel).

import { BACKGROUND_DESIGNS } from '@/lib/background-designs/registry';

interface BackgroundDesignPickerProps {
  id: string;
  value: string | undefined;
  onChange: (designId: string | undefined) => void;
  className?: string;
}

export default function BackgroundDesignPicker({ id, value, onChange, className }: BackgroundDesignPickerProps) {
  return (
    <select
      id={id}
      className={className}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
    >
      <option value="">None</option>
      {BACKGROUND_DESIGNS.map((d) => (
        <option key={d.id} value={d.id}>
          {d.name}
        </option>
      ))}
    </select>
  );
}
