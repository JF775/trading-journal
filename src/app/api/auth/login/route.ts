import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/db';

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

    // Strip password_hash before returning
    const safeUser = { ...result.user };
    delete safeUser.password_hash;

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      message: 'Login berhasil! Selamat datang kembali.'
    });

    // Set auth cookie for session persistence
    response.cookies.set('jfzla_user_session', String(safeUser.id || ''), {
      httpOnly: false, // accessible to client for smooth sync
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Terjadi kesalahan saat login.' },
      { status: 500 }
    );
  }
}
