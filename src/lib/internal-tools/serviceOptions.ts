import { getPage } from '@/lib/contentful/queries';
import { cardsOf, sectionsOf } from '@/lib/contentful/extract';

/**
 * Fallback service labels — the six practices as titled on the marketing site's services
 * page. Used only when the live Contentful fetch below is unavailable (local dev without
 * credentials, Contentful outage).
 */
const STANDARD_SERVICES: string[] = [
  'Enterprise Software Solutions',
  'Custom Development',
  'AI Integration',
  'Cloud Solutions',
  'SEO & Digital Growth',
  'Consulting & Host Management',
];

/**
 * The ByteFlow services list, shared across internal tools (CRM deal services). Same
 * source of truth as the marketing site's services page — its second section's
 * featureCards — with the static six-practice fallback when Contentful is unreachable or
 * unconfigured; never throws. Server-side only (Contentful fetch).
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
