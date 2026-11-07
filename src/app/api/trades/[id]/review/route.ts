import { NextRequest, NextResponse } from 'next/server';
import { updateTradeReview } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const updated = updateTradeReview(Number(id), body);
    if (!updated) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update review' }, { status: 400 });
  }
}
