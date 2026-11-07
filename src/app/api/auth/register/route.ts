import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/db';
import { prisma, hasNeonDatabase } from '@/lib/prisma';

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

    if (hasNeonDatabase() && safeUser.email) {
      try {
        const dbUser = await prisma.user.upsert({
          where: { email: safeUser.email },
          update: {
            name: safeUser.name || name.trim() || 'Trader',
            role: safeUser.role || 'client_starter',
            preferred_broker: safeUser.preferred_broker || 'Exness',
            last_login: new Date()
          },
          create: {
            id: safeUser.id,
            name: safeUser.name || name.trim() || 'Trader',
            email: safeUser.email,
            avatar: safeUser.avatar || undefined,
            provider: 'credentials',
            password_hash: result.user?.password_hash,
            role: safeUser.role || 'client_starter',
            preferred_broker: safeUser.preferred_broker || 'Exness',
            last_login: new Date()
          }
        });
        if (dbUser) {
          safeUser.id = dbUser.id;
          safeUser.role = dbUser.role as any;
        }
      } catch (prismaErr) {
        console.warn('Neon upsert failed on register:', prismaErr);
      }
    }

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
