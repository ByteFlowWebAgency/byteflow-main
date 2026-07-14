'use client';

import { useEffect } from 'react';
import chooserStyles from './chooser.module.css';
import styles from './preview.module.css';
import type { CapturedPage } from '../pdf/generateDocumentPdf';

interface PreviewModalProps {
  pages: CapturedPage[] | null;
  loading: boolean;
  onClose: () => void;
  onDownload: () => void;
  downloading: boolean;
}

/**
 * Shows the exact page images generateDocumentPdf would embed in the PDF — same capture,
 * same pagination — so the user can check the rendered result before spending a download
 * on it. Escape closes; the modal doesn't touch editor state.
 */
export default function PreviewModal({ pages, loading, onClose, onDownload, downloading }: PreviewModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={chooserStyles.overlay} role="dialog" aria-modal="true" aria-label="Document preview">
      <div className={styles.dialog}>
        <div className={styles.head}>
          <h2 className={styles.title}>Preview</h2>
          <div className={styles.headActions}>
            <button type="button" className={chooserStyles.primaryBtn} onClick={onDownload} disabled={downloading || loading}>
              {downloading ? 'Exporting…' : 'Download PDF'}
            </button>
            <button type="button" className={chooserStyles.ghostBtn} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        <div className={styles.body}>
          {loading && <p className={styles.status}>Rendering preview…</p>}
          {!loading && pages && pages.length === 0 && <p className={styles.status}>Nothing to preview yet.</p>}
          {!loading &&
            pages?.map((page, index) => (
              <div key={index} className={styles.page}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={page.dataUrl} alt={`Page ${index + 1} of ${pages.length}`} className={styles.pageImg} />
                <span className={styles.pageNum}>
                  Page {index + 1} of {pages.length}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
