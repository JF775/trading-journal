import { NextResponse } from 'next/server';
import { findUserById, findUserByEmail, getAllUsers } from '@/lib/db';
import { User, isUserAdmin, isUserPro, isUserAffiliate } from '@/lib/types';

export function getAuthenticatedUser(req: Request): User | null {
  try {
    // 1. Check x-user-id custom header
    const headerId = req.headers.get('x-user-id');
    if (headerId) {
      const user = findUserById(headerId);
      if (user) return user;
    }

    // 2. Check query parameter 'userId'
    try {
      const url = new URL(req.url);
      const queryId = url.searchParams.get('userId');
      if (queryId) {
        const user = findUserById(queryId);
        if (user) return user;
      }
    } catch (e) {
      // ignore
    }

    // 3. Check jfzla_user_session cookie
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/jfzla_user_session=([^;]+)/);
    if (match) {
      const cookieUserId = decodeURIComponent(match[1]);
      const user = findUserById(cookieUserId);
      if (user) return user;
    }
  } catch (err) {
    console.error('Error resolving authenticated user:', err);
  }

  return null;
}

export function requireAuth(req: Request): { user: User; errorResponse?: never } | { user?: never; errorResponse: NextResponse } {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Unauthorized: Akses terminal memerlukan login terlebih dahulu.' },
        { status: 401 }
      )
    };
  }
  return { user };
}
