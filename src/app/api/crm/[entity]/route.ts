import { NextResponse, type NextRequest } from 'next/server';
import {
  handleList,
  handleSave,
  handleSaveMany,
} from '@/lib/internal-tools/storage/apiHandlers';
import { isCrmEntity } from '@/lib/internal-tools/storage/types';

export const runtime = 'nodejs';

type Context = { params: Promise<{ entity: string }> };

function unknownEntity() {
  return NextResponse.json(
    { error: { code: 'NOT_FOUND', message: 'Unknown CRM entity.' } },
    { status: 404 },
  );
}

export async function GET(request: NextRequest, { params }: Context) {
  const { entity } = await params;
  if (!isCrmEntity(entity)) return unknownEntity();
  return handleList(request, entity);
}

export async function PUT(request: NextRequest, { params }: Context) {
  const { entity } = await params;
  if (!isCrmEntity(entity)) return unknownEntity();
  return handleSave(request, entity);
}

export async function POST(request: NextRequest, { params }: Context) {
  const { entity } = await params;
  if (!isCrmEntity(entity)) return unknownEntity();
  return handleSaveMany(request, entity);
}
