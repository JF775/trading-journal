import { NextResponse } from 'next/server';
import { findUserById } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { prisma, hasNeonDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const headerId = req.headers.get('x-user-id');
    const queryId = url.searchParams.get('userId');
    const cookieHeader = req.headers.get('cookie') || '';
    const cookieMatch = cookieHeader.match(/jfzla_user_session=([^;]+)/);
    const cookieUserId = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';

    const targetId = headerId || queryId || cookieUserId;
    let user: any = null;

    // 1. Neon DB lookup FIRST as authoritative source of truth
    if (hasNeonDatabase() && targetId) {
      try {
        const dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { id: targetId },
              { email: targetId.includes('@') ? targetId.toLowerCase().trim() : undefined }
            ]
          }
        });
        if (dbUser) {
          user = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            avatar: dbUser.avatar || undefined,
            provider: dbUser.provider as any,
            role: dbUser.role as any,
            preferred_broker: (dbUser.preferred_broker as any) || 'Exness',
            created_at: dbUser.created_at.toISOString(),
            last_login: dbUser.last_login?.toISOString()
          };
        }
      } catch (e) {
        console.warn('Neon DB lookup in auth/me failed:', e);
      }
    }

    // 2. Fallback to memory / local disk
    if (!user) {
      user = getAuthenticatedUser(req);
      if (!user && targetId) {
        user = findUserById(targetId) || null;
      }
    }

    if (!user) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    const safeUser = { ...user };
    delete safeUser.password_hash;

    return NextResponse.json({ success: true, user: safeUser });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
