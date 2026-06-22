import { toNavLink, type AssetLike, type NavLinkData } from './props';

// Loose shapes describing the parts of an include-resolved getPage() response we read.
// The Contentful SDK generics for the resolved header union (hero | sectionHeader) and
// card union (featureCard | caseStudy) are unwieldy, so we narrow structurally instead.

export interface NavLinkFields {
  label?: string;
  url?: string;
  openInNewTab?: boolean;
}

export interface Linked<T> {
  fields?: T;
}

/** A `hero` or `sectionHeader` entry's fields (the section "header"). */
export interface HeaderFields {
  eyebrow?: string;
  heading?: string;
  subText?: string;
  primaryCta?: Linked<NavLinkFields>;
  secondaryCta?: Linked<NavLinkFields>;
}

/** A `featureCard` or `caseStudy` entry's fields (the section "cards"). */
export interface CardFields {
  eyebrow?: string;
  title?: string;
  tagline?: string;
  description?: string;
  bullets?: string[];
  companyName?: string;
  thumbnail?: AssetLike;
  url?: string;
}

export interface SectionFields {
  header?: Linked<HeaderFields>;
  cards?: Linked<CardFields>[];
}

/** Unwrap a page entry's resolved sections into their plain fields. */
export function sectionsOf(page?: { fields?: { sections?: unknown } }): SectionFields[] {
  const sections = (page?.fields?.sections ?? []) as unknown as Linked<SectionFields>[];
  return sections.map((s) => s.fields ?? {});
}

/** The header fields of a section, if present. */
export function headerOf(section?: SectionFields): HeaderFields | undefined {
  return section?.header?.fields;
}

/** The card fields of a section (empty array if none). */
export function cardsOf(section?: SectionFields): CardFields[] {
  return (section?.cards ?? []).map((c) => c.fields ?? {});
}

/** A navLink link → plain NavLinkData, or undefined when the link is absent. */
export function ctaFrom(link?: Linked<NavLinkFields>): NavLinkData | undefined {
  return link?.fields ? toNavLink(link.fields) : undefined;
}
