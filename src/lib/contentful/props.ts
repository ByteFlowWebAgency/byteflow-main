// Plain, serializable prop shapes extracted from Contentful entries in the server
// components (page.tsx / layout.tsx) and passed down to the presentational components.
// Keeping these here means the components never need to know the Contentful entry shape.

export interface NavLinkData {
  label: string;
  url: string;
  openInNewTab?: boolean;
}

/** A featureCard rendered as a simple title + description card (Services, Why). */
export interface CardData {
  title: string;
  desc: string;
}

/** A featureCard rendered as a numbered step in the Hero showcase. */
export interface StepData {
  num: string;
  title: string;
  desc: string;
}

/** A Contentful image asset reduced to what next/image needs. */
export interface LogoData {
  url: string;
  alt: string;
  width: number;
  height: number;
}

/** A footer column: a title plus its list of links. */
export interface FooterColumnData {
  title: string;
  links: NavLinkData[];
}

/** A resolved Contentful image asset (the parts we read). */
export interface AssetLike {
  fields?: {
    title?: string;
    file?: {
      url?: string;
      details?: { image?: { width?: number; height?: number } };
    };
  };
}

const SITE_ORIGIN = 'https://www.byteflow.us';

/**
 * Normalize a CMS url. Internal links come back as absolute same-site URLs
 * (https://www.byteflow.us/...); strip the origin so they render as relative paths —
 * identical to the previous hardcoded hrefs and keeping next/link client-side
 * navigation. True external URLs are left untouched.
 */
export function toHref(url?: string): string {
  if (!url) return '#';
  if (url.startsWith(SITE_ORIGIN)) {
    return url.slice(SITE_ORIGIN.length) || '/';
  }
  return url;
}

/** Map a resolved navLink entry's fields into a plain NavLinkData (with normalized href). */
export function toNavLink(fields?: {
  label?: string;
  url?: string;
  openInNewTab?: boolean;
}): NavLinkData {
  return {
    label: fields?.label ?? '',
    url: toHref(fields?.url),
    openInNewTab: fields?.openInNewTab ?? false,
  };
}

/** <a> attributes for a navLink: external links open in a new tab with safe rel. */
export function linkAttrs(navLink?: NavLinkData) {
  const openInNewTab = navLink?.openInNewTab ?? false;
  return {
    href: navLink?.url ?? '#',
    target: openInNewTab ? ('_blank' as const) : undefined,
    rel: openInNewTab ? 'noopener noreferrer' : undefined,
  };
}

/**
 * Prefix the protocol-relative Contentful asset url (//images.ctfassets.net/...) with
 * https:. Returns null if the asset is missing/unresolved.
 */
export function assetUrl(asset?: AssetLike): string | null {
  const url = asset?.fields?.file?.url;
  if (!url) return null;
  return url.startsWith('//') ? `https:${url}` : url;
}

/**
 * Reduce a resolved Contentful image asset to LogoData. Intrinsic dimensions are passed
 * to next/image so the asset is not distorted (CSS controls the displayed height).
 * Returns null if the asset is missing/unresolved.
 */
export function toLogo(asset?: AssetLike): LogoData | null {
  const url = assetUrl(asset);
  if (!url) return null;
  const image = asset?.fields?.file?.details?.image;
  return {
    url,
    alt: asset?.fields?.title ?? 'ByteFlow',
    width: image?.width ?? 757,
    height: image?.height ?? 742,
  };
}
