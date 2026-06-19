// lib/contentful/queries.ts

import { getContentfulClient } from './client';

export async function getPage(slug: string) {
    const entries = await getContentfulClient().getEntries({
        content_type: 'page',
        'fields.slug': slug,
        include: 10,
    })
    return entries.items[0]
}

export async function getCaseStudy() {
    const entries = await getContentfulClient().getEntries({
        content_type: 'caseStudy',
    })
    return entries.items
}

export async function getCtaCard() {
    const entries = await getContentfulClient().getEntries({
        content_type: 'ctaCard',
    })
    return entries.items
}

export async function getFeatureCard() {
    const entries = await getContentfulClient().getEntries({
        content_type: 'featureCard',
    })
    return entries.items
}

export async function getFooter() {
    const entries = await getContentfulClient().getEntries({
        content_type: 'footer',
    })
    return entries.items
}

export async function getFooterColumn() {
    const entries = await getContentfulClient().getEntries({
        content_type: 'footerColumn',
    })
    return entries.items
}

export async function getHeader() {
    const entries = await getContentfulClient().getEntries({
        content_type: 'header',
    })
    return entries.items
}

export async function getHero() {
    const entries = await getContentfulClient().getEntries({
        content_type: 'hero',
    })
    return entries.items
}

export async function getNavLink() {
    const entries =await getContentfulClient().getEntries({
        content_type: 'navLink',
    })
    return entries.items
}

export async function getSection() {
    const entries = await getContentfulClient().getEntries({
        content_type: 'section',
    })
    return entries.items
}

export async function getSeo() {
    const entries = await getContentfulClient().getEntries({
        content_type: 'seo',
    })
    return entries.items
}
