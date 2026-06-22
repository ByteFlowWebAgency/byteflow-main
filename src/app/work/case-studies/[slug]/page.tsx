// app/case-study/[slug]/page.tsx

import { getCaseStudyBySlug, getAllCaseStudies } from '@/lib/contentful/queries'

export async function generateStaticParams() {
  const caseStudies = await getAllCaseStudies()
  return caseStudies.map((entry) => ({
    slug: entry.fields.slug,
  }))
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
    const {slug} = await params
  const caseStudy = await getCaseStudyBySlug(slug)
  console.log(caseStudy)

  return (
    <>
      <pre>{JSON.stringify(caseStudy, null, 2)}</pre>
    </>
  )
}