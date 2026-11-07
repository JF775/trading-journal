import { NextRequest, NextResponse } from 'next/server';
import { calculateAnalytics, initDB, initAccountsDB } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const account_id = searchParams.get('account_id') || undefined;
  const user = getAuthenticatedUser(request);

  initAccountsDB(true);
  initDB(true);
  const analytics = calculateAnalytics(account_id, user?.id);
  return NextResponse.json(analytics, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
  });
}
