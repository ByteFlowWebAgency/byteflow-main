// Cheap document index: id / organizationId / name / updatedAt, never the `data` blob.
// This is what the documents list and the meetings "Ready vs Needs prep" badge read —
// pulling full documents (pages with embedded image data URLs, megabytes each) just to
// answer "does this client have one?" would be absurd.

import { NextResponse } from 'next/server';
import { getCurrentInternalUser } from '@/lib/internal-tools/auth/server';
import {
  isSupabaseConfigured,
  listDocumentSummaries,
} from '@/lib/internal-tools/storage/server';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getCurrentInternalUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHENTICATED', message: 'Sign in first.' } },
      { status: 401 },
    );
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: { code: 'NOT_CONFIGURED', message: 'Supabase not configured.' } },
      { status: 501 },
    );
  }
  try {
    return NextResponse.json({ data: await listDocumentSummaries() });
  } catch {
    return NextResponse.json(
      { error: { code: 'UPSTREAM', message: 'Could not load documents.' } },
      { status: 502 },
    );
  }
}
