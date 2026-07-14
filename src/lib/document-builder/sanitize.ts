// Rich-text sanitizer for richText/callout blocks. The stored value is HTML that later
// gets rendered and PDF-captured, so it is treated as untrusted at every boundary: applied
// on every write, on paste, and again on import (02-BLOCKS-AND-PAGES.md).
//
// Whitelist (the ONLY tags kept): p, strong, em, a, ul, ol, li, br. Everything else is
// unwrapped (its text survives) or, for dangerous containers, dropped whole. All
// attributes are stripped except a safe href on <a>. No inline styles, no event handlers,
// no javascript: URLs.

const ALLOWED_TAGS = new Set(['p', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'br']);

// Tags whose *content* is discarded entirely (never merely unwrapped).
const DROP_WITH_CONTENT = new Set([
  'script',
  'style',
  'template',
  'head',
  'title',
  'meta',
  'link',
  'iframe',
  'object',
  'embed',
  'noscript',
  'svg',
  'math',
]);

// Common inbound tags remapped to a whitelisted equivalent so pasted structure survives.
const REMAP: Record<string, string> = {
  b: 'strong',
  i: 'em',
  u: 'em',
  div: 'p',
  section: 'p',
  article: 'p',
  blockquote: 'p',
  h1: 'p',
  h2: 'p',
  h3: 'p',
  h4: 'p',
  h5: 'p',
  h6: 'p',
};

/**
 * Drop ASCII control characters (code <= 31) and spaces from an href before scheme-testing
 * it, so obfuscations like "java\tscript:" or "java\nscript:" can't slip past the test.
 * Printable URL characters such as '-' and '.' (code >= 45) are preserved.
 */
function stripHrefNoise(raw: string): string {
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    if (raw.charCodeAt(i) > 32) out += raw[i];
  }
  return out;
}

function safeHref(raw: string): string | null {
  const stripped = stripHrefNoise(raw);
  if (stripped === '') return null;
  if (/^(https?:|mailto:)/i.test(stripped)) return stripped;
  if (/^[a-z][a-z0-9+.-]*:/i.test(stripped)) return null; // any other scheme -> drop
  return raw.trim(); // relative path / #anchor -> keep original, just trimmed
}

/** Recursively sanitize a node's children in place against the whitelist. */
function scrub(node: Node, doc: Document): void {
  // Iterate over a static copy — we mutate the child list as we go.
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.TEXT_NODE) continue; // text is always safe
    if (child.nodeType !== Node.ELEMENT_NODE) {
      node.removeChild(child); // comments, processing instructions, etc.
      continue;
    }

    const el = child as Element;
    const tag = el.tagName.toLowerCase();

    if (DROP_WITH_CONTENT.has(tag)) {
      node.removeChild(el);
      continue;
    }

    const mapped = REMAP[tag] ?? tag;

    if (!ALLOWED_TAGS.has(mapped)) {
      // Unwrap: sanitize its children, then hoist them in place of the element.
      scrub(el, doc);
      while (el.firstChild) node.insertBefore(el.firstChild, el);
      node.removeChild(el);
      continue;
    }

    // Allowed (possibly remapped). Rebuild as a clean element with only safe attributes.
    const clean = doc.createElement(mapped);
    if (mapped === 'a') {
      const href = safeHref(el.getAttribute('href') ?? '');
      if (href !== null) clean.setAttribute('href', href);
      clean.setAttribute('rel', 'noopener noreferrer nofollow');
    }
    while (el.firstChild) clean.appendChild(el.firstChild);
    scrub(clean, doc);
    node.replaceChild(clean, el);
  }
}

/**
 * Sanitize an untrusted HTML fragment to the block whitelist. DOM-based; safe to call in
 * any client context. Returns a normalized fragment string.
 */
export function sanitizeRichHtml(input: string): string {
  if (typeof input !== 'string' || input === '') return '';
  // A detached document — parsing here never executes scripts or loads resources.
  const doc =
    typeof document !== 'undefined'
      ? document.implementation.createHTMLDocument('')
      : null;
  if (!doc) {
    // No DOM (should not happen — all callers are client-side). Fail closed: strip all tags.
    return input.replace(/<[^>]*>/g, '').trim();
  }
  const holder = doc.createElement('div');
  holder.innerHTML = input;
  scrub(holder, doc);
  return holder.innerHTML.trim();
}

/** True when a sanitized fragment carries no visible text (empty/whitespace-only). */
export function isRichHtmlEmpty(html: string): boolean {
  if (typeof document === 'undefined') return html.replace(/<[^>]*>/g, '').trim() === '';
  const holder = document.createElement('div');
  holder.innerHTML = html;
  return (holder.textContent ?? '').trim() === '';
}
