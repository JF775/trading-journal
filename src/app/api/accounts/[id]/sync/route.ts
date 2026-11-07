import { NextRequest, NextResponse } from 'next/server';
import { syncAccount, getAccountById } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { prisma, hasNeonDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = getAuthenticatedUser(request);
    let targetUserId = user?.id;
    if (!targetUserId) {
      const headerId = request.headers.get('x-user-id');
      const cookieHeader = request.headers.get('cookie') || '';
      const cookieMatch = cookieHeader.match(/jfzla_user_session=([^;]+)/);
      targetUserId = headerId || (cookieMatch ? decodeURIComponent(cookieMatch[1]) : undefined);
    }

    let acc: any = null;
    if (hasNeonDatabase()) {
      try {
        acc = await prisma.brokerAccount.findUnique({
          where: { id }
        });
      } catch (e) {
        console.warn('Neon lookup in sync route error:', e);
      }
    }

    if (!acc) {
      acc = getAccountById(id, targetUserId);
    }

    if (!acc) {
      return NextResponse.json(
        { error: 'Akun broker tidak ditemukan atau Anda tidak memiliki akses ke akun ini.' },
        { status: 404 }
      );
    }

    const result = await syncAccount(id, targetUserId || acc.user_id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Account sync error:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal menyinkronkan akun dengan server broker' },
      { status: 500 }
    );
  }
}
