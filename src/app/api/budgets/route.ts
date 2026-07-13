import { type NextRequest } from 'next/server';
import {
  handleList,
  handleSave,
  handleSaveMany,
} from '@/lib/internal-tools/storage/apiHandlers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return handleList(request, 'budgets');
}

export async function PUT(request: NextRequest) {
  return handleSave(request, 'budgets');
}

export async function POST(request: NextRequest) {
  return handleSaveMany(request, 'budgets');
}
