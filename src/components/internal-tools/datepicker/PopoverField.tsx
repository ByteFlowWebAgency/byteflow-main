'use client';

// The trigger + portaled popover shared by DatePicker and MonthPicker. Owns open/close,
// outside-click and Escape dismissal, and viewport-aware positioning (the popover is
// portaled to <body> so it never clips inside a scrollable pane or dialog). Wraps the
// portal content in .bfScope so the brand tokens resolve outside the tool subtree.

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './picker.module.css';

interface PopoverFieldProps {
  id?: string;
  ariaLabel?: string;
  placeholder: string;
  displayValue: string; // '' → placeholder shown
  disabled?: boolean;
  popoverLabel: string;
  children: (api: { close: () => void }) => React.ReactNode;
}

export default function PopoverField({
  id,
  ariaLabel,
  placeholder,
  displayValue,
  disabled,
  popoverLabel,
  children,
}: PopoverFieldProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const reposition = useCallback(() => {
    const trigger = triggerRef.current;
    const pop = popRef.current;
    if (!trigger || !pop) return;
    const rect = trigger.getBoundingClientRect();
    const popH = pop.offsetHeight || 320;
    const popW = pop.offsetWidth || 300;
    let top = rect.bottom + 6;
    if (top + popH > window.innerHeight - 8 && rect.top - popH - 6 > 8) {
      top = rect.top - popH - 6; // flip above when there's no room below
    }
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - popW - 8));
    setPos({ top, left });
  }, []);

  useEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    reposition();
    const handle = () => reposition();
    window.addEventListener('scroll', handle, true);
    window.addEventListener('resize', handle);
    return () => {
      window.removeEventListener('scroll', handle, true);
      window.removeEventListener('resize', handle);
    };
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (popRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        className={`${styles.trigger} ${displayValue ? '' : styles.triggerEmpty}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.triggerText}>{displayValue || placeholder}</span>
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="4.5" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
          <path d="M3 9h18M8 3v3M16 3v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="bfScope">
            <div
              ref={popRef}
              role="dialog"
              aria-label={popoverLabel}
              className={styles.popover}
              // Off-screen (not visibility:hidden) for the pre-position frame, so the
              // calendar's mount-focus can still land — hidden elements aren't focusable.
              style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
            >
              {children({ close })}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
