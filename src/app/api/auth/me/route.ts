import { NextResponse } from 'next/server';
import { findUserById } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { prisma, hasNeonDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    let user = getAuthenticatedUser(req);

    if (!user) {
      const url = new URL(req.url);
      const queryId = url.searchParams.get('userId') || req.headers.get('x-user-id');
      if (queryId) {
        user = findUserById(queryId) || null;
        if (!user && hasNeonDatabase()) {
          try {
            const dbUser = await prisma.user.findUnique({ where: { id: queryId } });
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
            console.warn('Prisma auth/me lookup error:', e);
          }
        }
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
