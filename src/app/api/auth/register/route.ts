import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, preferred_broker } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Nama, email, dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const result = registerUser(
      name,
      email,
      password,
      'credentials',
      undefined,
      preferred_broker || 'Exness'
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    const safeUser = { ...result.user };
    delete safeUser.password_hash;

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      message: 'Registrasi berhasil! Akun Anda siap digunakan.'
    });

    response.cookies.set('jfzla_user_session', String(safeUser.id || ''), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal mendaftar akun.' },
      { status: 500 }
    );
  }
}
