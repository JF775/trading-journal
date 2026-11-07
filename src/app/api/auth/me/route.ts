import { NextResponse } from 'next/server';
import { findUserById, findUserByEmail } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth-server';

export async function GET(req: Request) {
  try {
    const user = getAuthenticatedUser(req);

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
