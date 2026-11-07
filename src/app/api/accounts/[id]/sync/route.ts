import { NextRequest, NextResponse } from 'next/server';
import { syncAccount, getAccountById } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = getAuthenticatedUser(request);
    const acc = getAccountById(id, user?.id);
    if (!acc) {
      return NextResponse.json(
        { error: 'Akun broker tidak ditemukan atau Anda tidak memiliki akses ke akun ini.' },
        { status: 404 }
      );
    }
    const result = await syncAccount(id, user?.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Account sync error:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal menyinkronkan akun dengan server broker' },
      { status: 500 }
    );
  }
}
