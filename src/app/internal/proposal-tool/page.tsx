import type { Metadata } from 'next';
import ProposalToolApp from '@/components/proposal-tool/ProposalToolApp';
import { getPage } from '@/lib/contentful/queries';
import { cardsOf, sectionsOf } from '@/lib/contentful/extract';
import { STANDARD_SERVICES } from '@/lib/proposal-tool/defaults';

export const metadata: Metadata = {
  title: 'Proposal Tool · ByteFlow Internal',
  robots: { index: false, follow: false },
};

// Session-gated internal tool — always render per-request, never prerender.
export const dynamic = 'force-dynamic';

/**
 * Service labels come from the same Contentful featureCards the marketing site's
 * services page renders (its second section), so the proposal tool shares the site's
 * source of truth. Falls back to the static six-practice list when Contentful is
 * unreachable or unconfigured — the tool must never crash over this.
 */
async function getServiceOptions(): Promise<string[]> {
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

export default async function ProposalToolPage() {
  const serviceOptions = await getServiceOptions();
  return <ProposalToolApp serviceOptions={serviceOptions} />;
}
