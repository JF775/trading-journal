import { NextRequest, NextResponse } from 'next/server';
import { getTradingPlan, updateTradingPlan } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);
    const plan = getTradingPlan(user?.id);
    return NextResponse.json(plan);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to get trading plan' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);
    const body = await request.json();
    const updated = updateTradingPlan(body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update trading plan' }, { status: 500 });
  }
}
