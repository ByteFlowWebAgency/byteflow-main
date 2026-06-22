import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// Every route that renders Contentful content. A publish in Contentful can touch a
// nested entry (a feature card, CTA, header, or footer) that isn't itself a page, and
// header/footer live in the shared root layout — so any change refreshes the whole set
// rather than trying to map a nested entry back to a single page.
const PATHS = ["/", "/about", "/services", "/work", "/contact"];

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

  // Body isn't required to revalidate, but surfacing what changed helps debugging.
  let triggeredBy: string | undefined;
  try {
    const body = await req.json();
    triggeredBy = body?.sys?.contentType?.sys?.id ?? body?.sys?.type;
  } catch {
    // No / invalid JSON body (e.g. a webhook test ping) — revalidate anyway.
  }

  for (const path of PATHS) {
    revalidatePath(path);
  }

  return NextResponse.json({
    revalidated: true,
    paths: PATHS,
    triggeredBy,
    now: Date.now(),
  });
}
