// The one CSV utility for every internal tool (CRM contact/deal exports, budget
// exports). Generates spreadsheet-safe CSV client-side and triggers a download with the
// same anchor pattern the PDF engine uses.

export type CsvValue = string | number | null | undefined;

/**
 * Escape one CSV field. Beyond RFC-4180 quoting, any field starting with = + - or @ is
 * prefixed with a single quote so spreadsheet apps treat it as text, not a formula —
 * CSV formula injection via a crafted contact name is a real, well-known pitfall.
 */
function escapeField(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  let text = typeof value === 'number' ? String(value) : value;
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv(headers: string[], rows: CsvValue[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeField).join(','));
  return `${lines.join('\r\n')}\r\n`;
}

export function downloadCsv(filename: string, csv: string): void {
  // BOM so Excel detects UTF-8 (names with accents survive a double-click open).
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
  downloadBlob(filename, blob);
}

export function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  downloadBlob(filename, blob);
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
