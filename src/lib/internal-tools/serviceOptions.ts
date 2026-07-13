import { getPage } from '@/lib/contentful/queries';
import { cardsOf, sectionsOf } from '@/lib/contentful/extract';
import { STANDARD_SERVICES } from '@/lib/proposal-tool/defaults';

/**
 * The ByteFlow services list, shared across internal tools (proposal service lines, CRM
 * deal services). Same source of truth as the marketing site's services page — its
 * second section's featureCards — with the static six-practice fallback when Contentful
 * is unreachable or unconfigured; never throws. Server-side only (Contentful fetch).
 *
 * The proposal tool page predates this helper and keeps its own identical copy to stay
 * untouched per phase-5 guardrails; folding it onto this one is a safe future cleanup.
 */
export async function getServiceOptions(): Promise<string[]> {
  try {
    const page = await getPage('services');
    const titles = cardsOf(sectionsOf(page)[1])
      .map((card) => card.title)
      .filter((title): title is string => Boolean(title));
    return titles.length > 0 ? titles : STANDARD_SERVICES;
  } catch {
    return STANDARD_SERVICES;
  }
}
