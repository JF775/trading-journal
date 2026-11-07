import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/db';
import { prisma, hasNeonDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const result = authenticateUser(email, password);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    const safeUser = { ...result.user };
    delete safeUser.password_hash;

    // Synchronize authoritative role and profile from Neon DB if connected
    if (hasNeonDatabase() && safeUser.email) {
      try {
        const dbUser = await prisma.user.findFirst({
          where: { email: safeUser.email.toLowerCase().trim() }
        });
        if (dbUser) {
          safeUser.role = dbUser.role as any;
          safeUser.id = dbUser.id;
          if (dbUser.preferred_broker) safeUser.preferred_broker = dbUser.preferred_broker as any;
        }
      } catch (e) {
        console.warn('Neon check in login failed:', e);
      }
    }

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      message: 'Login berhasil! Selamat datang kembali.'
    });

    response.cookies.set('jfzla_user_session', String(safeUser.id || ''), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Terjadi kesalahan saat login.' },
      { status: 500 }
    );
  }
}
