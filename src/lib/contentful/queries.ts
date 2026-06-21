import { getContentfulClient } from './client';

// All page content resolves via include: 10
// sections → sectionHeaders → featureCards all come with this one call
export async function getPage(slug: string) {
  const entries = await getContentfulClient().getEntries({
    content_type: 'page',
    'fields.slug': slug,
    include: 10,
  })
  return entries.items[0]
}

// Header lives in root layout, fetched once
export async function getHeader() {
  const entries = await getContentfulClient().getEntries({
    content_type: 'header',
    limit: 1,
    include: 3,
  })
  return entries.items[0]  // single entry, not array
}

// Footer lives in root layout, fetched once
export async function getFooter() {
  const entries = await getContentfulClient().getEntries({
    content_type: 'footer',
    limit: 1,
    include: 3,
  })
  return entries.items[0]  // single entry, not array
}

// Case studies fetched as a collection
export async function getCaseStudies() {
  const entries = await getContentfulClient().getEntries({
    content_type: 'caseStudy',
  })
  return entries.items
}

// For generateStaticParams in Next.js
export async function getAllPageSlugs() {
  const entries = await getContentfulClient().getEntries({
    content_type: 'page',
    select: ['fields.slug'],
  })
  return entries.items.map((item) => item.fields.slug)
}