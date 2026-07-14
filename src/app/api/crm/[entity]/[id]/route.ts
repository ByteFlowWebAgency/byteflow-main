import { NextResponse, type NextRequest } from 'next/server';
import {
  handleGet,
  handleRemove,
} from '@/lib/internal-tools/storage/apiHandlers';
import { isCrmEntity } from '@/lib/internal-tools/storage/types';

export const runtime = 'nodejs';

type Context = { params: Promise<{ entity: string; id: string }> };

function unknownEntity() {
  return NextResponse.json(
    { error: { code: 'NOT_FOUND', message: 'Unknown CRM entity.' } },
    { status: 404 },
  );
}

export async function GET(request: NextRequest, { params }: Context) {
  const { entity, id } = await params;
  if (!isCrmEntity(entity)) return unknownEntity();
  return handleGet(request, entity, id);
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { entity, id } = await params;
  if (!isCrmEntity(entity)) return unknownEntity();
  return handleRemove(request, entity, id);
}
