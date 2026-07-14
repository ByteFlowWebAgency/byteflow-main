import { type NextRequest } from 'next/server';
import {
  handleGet,
  handleRemove,
} from '@/lib/internal-tools/storage/apiHandlers';

export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return handleGet(request, 'budgets', id);
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return handleRemove(request, 'budgets', id);
}
