import { NextRequest, NextResponse } from 'next/server';
import { getAllAccounts, addAccount, initAccountsDB, initDB } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  initAccountsDB(true);
  initDB(true);
  const user = getAuthenticatedUser(request);
  const accounts = getAllAccounts(user?.id);
  return NextResponse.json(accounts, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);
    const body = await request.json();

    if (!body.login || !body.server) {
      return NextResponse.json(
        { error: 'Server broker dan nomor akun (Login) wajib diisi.' },
        { status: 400 }
      );
    }

    const newAccount = addAccount(body, user?.id);
    return NextResponse.json(newAccount, { status: 201 });
  } catch (error: any) {
    console.error('Error adding broker account:', error);
    return NextResponse.json({ error: error.message || 'Gagal menambahkan akun broker.' }, { status: 400 });
  }
}
