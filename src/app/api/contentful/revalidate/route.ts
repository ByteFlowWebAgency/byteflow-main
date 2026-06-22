import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// Static pages that render Contentful content. Note the case study detail pages
// live at the *dynamic* route /work/case-studies/[slug] — revalidating that needs
// the route pattern + "page" type, not a literal path.
const PAGE_PATHS = ["/", "/about", "/services", "/work", "/contact"];
const CASE_STUDY_ROUTE = "/work/case-studies/[slug]";

// Header/footer (and the nested entries they contain) render in the shared root
// layout, so a change to them — or to any nested component entry we can't map back
// to a single page — has to refresh the whole set.
function revalidateEverything(): string[] {
  for (const path of PAGE_PATHS) revalidatePath(path);
  revalidatePath(CASE_STUDY_ROUTE, "page");
  return [...PAGE_PATHS, CASE_STUDY_ROUTE];
}

// A `page` entry's slug maps directly to its route ("/" for home, "/work", etc.).
function pagePathFromSlug(slug: string): string {
  return slug === "/" ? "/" : `/${slug.replace(/^\/+/, "")}`;
}

export async function POST(req: NextRequest) {
  const secret = process.env.CONTENTFUL_REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CONTENTFUL_REVALIDATE_SECRET is not configured" },
      { status: 500 },
    );
  }

  // Contentful sends the value of a custom header configured on the webhook.
  if (req.headers.get("x-contentful-webhook-secret") !== secret) {
    return NextResponse.json({ error: "Invalid or missing secret" }, { status: 401 });
  }

  // The webhook body is the changed entry. We use its content type to revalidate only
  // the affected routes. A missing/invalid body (e.g. a webhook test ping) leaves
  // contentType undefined, which falls through to a full refresh.
  let contentType: string | undefined;
  let slug: string | undefined;
  try {
    const body = await req.json();
    contentType = body?.sys?.contentType?.sys?.id;
    const rawSlug = body?.fields?.slug?.["en-US"];
    slug = typeof rawSlug === "string" ? rawSlug : undefined;
  } catch {
    // No / invalid JSON body — fall through to a full refresh below.
  }

  let revalidated: string[];
  if (contentType === "caseStudy") {
    // The detail pages, plus the Work page that lists them as cards.
    revalidatePath("/work");
    revalidatePath(CASE_STUDY_ROUTE, "page");
    revalidated = ["/work", CASE_STUDY_ROUTE];
  } else if (contentType === "page" && slug) {
    const path = pagePathFromSlug(slug);
    revalidatePath(path);
    revalidated = [path];
  } else {
    // header / footer / nav, a nested page component, or an unknown/empty payload.
    revalidated = revalidateEverything();
  }

  return NextResponse.json({
    revalidated: true,
    paths: revalidated,
    triggeredBy: contentType,
    now: Date.now(),
  });
}
