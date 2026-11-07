import { NextRequest, NextResponse } from 'next/server';
import { syncAllAccounts } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);
    let force = false;
    try {
      const body = await request.json();
      force = Boolean(body.force);
    } catch {
      // Body may be empty, defaults to force=false
    }

    const result = await syncAllAccounts(force, user?.id);
    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal menyinkronkan batch akun MT5' },
      { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  }
}
