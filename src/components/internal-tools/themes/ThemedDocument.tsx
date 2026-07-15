'use client';

import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import type { Theme } from './themeTypes';
import { themeToCss } from './themeToCss';
import './themedOverrides.css';

interface ThemedDocumentProps {
  theme: Theme;
  children: ReactNode;
}

/**
 * The theme override layer: a wrapper that sets the document custom properties inline
 * so they cascade into the existing document components with zero edits to them. This
 * div is also the PDF export node — the engine clones it, and inline styles travel with
 * the clone, so preview and export always agree on the theme.
 *
 * width: fit-content keeps the wrapper's box identical to the 816px document inside it
 * (the document centers itself in the pane via its own margin: 0 auto, which now acts
 * on this wrapper instead — same geometry either way).
 */
const ThemedDocument = forwardRef<HTMLDivElement, ThemedDocumentProps>(
  function ThemedDocument({ theme, children }, ref) {
    return (
      <div
        ref={ref}
        style={{ ...themeToCss(theme), width: 'fit-content', margin: '0 auto' }}
        data-bf-themed={theme.id}
      >
        {children}
      </div>
    );
  },
);

export default ThemedDocument;
