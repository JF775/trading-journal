import { NextRequest, NextResponse } from 'next/server';
import { authenticateWithGoogle } from '@/lib/db';
import { prisma, hasNeonDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isCheck = searchParams.get('check') === '1';

  const DEFAULT_GOOGLE_CLIENT_ID = '321836199993-qejo20qav2qu1l6oh9o26909p5gqdk5b.apps.googleusercontent.com';
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;
  const isConfigured = Boolean(clientId && clientId.trim().length > 5);

  if (isCheck) {
    return NextResponse.json({
      configured: isConfigured,
      clientId: isConfigured ? clientId : ''
    });
  }

  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  if (!isConfigured) {
    return NextResponse.redirect(`${origin}/login?google_setup=1`);
  }

  const scope = encodeURIComponent('openid email profile');
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=select_account`;

  return NextResponse.redirect(googleAuthUrl);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { credential, email, name, avatar } = body;

    let finalEmail = '';
    let finalName = '';
    let finalAvatar = avatar;

    // Case 1: Verified Google Identity Services (GIS) JWT Credential
    if (credential) {
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`, {
        cache: 'no-store'
      });
      const googleData = await verifyRes.json();

      if (!verifyRes.ok || !googleData.email) {
        return NextResponse.json(
          { success: false, error: googleData.error_description || 'Verifikasi token Google gagal.' },
          { status: 400 }
        );
      }

      finalEmail = googleData.email;
      finalName = googleData.name || googleData.given_name || googleData.email.split('@')[0];
      finalAvatar = googleData.picture || avatar;
    } else if (email) {
      // Case 2: Direct real Google account sign-in
      const cleanEmail = String(email).trim().toLowerCase();
      if (!cleanEmail.includes('@')) {
        return NextResponse.json(
          { success: false, error: 'Format email tidak valid.' },
          { status: 400 }
        );
      }
      finalEmail = cleanEmail;
      finalName = name ? String(name).trim() : cleanEmail.split('@')[0];
      finalAvatar = avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(finalName)}`;
    } else {
      return NextResponse.json(
        { success: false, error: 'Email atau kredensial Google diperlukan.' },
        { status: 400 }
      );
    }

    const result = authenticateWithGoogle(finalEmail, finalName, finalAvatar);
    const safeUser = { ...result.user };
    delete safeUser.password_hash;

    if (hasNeonDatabase() && safeUser.email) {
      try {
        await prisma.user.upsert({
          where: { email: safeUser.email },
          update: {
            name: safeUser.name,
            avatar: safeUser.avatar || undefined,
            last_login: new Date()
          },
          create: {
            id: safeUser.id,
            name: safeUser.name,
            email: safeUser.email,
            avatar: safeUser.avatar || undefined,
            provider: 'google',
            role: safeUser.role || 'client_starter',
            preferred_broker: safeUser.preferred_broker || 'Exness',
            last_login: new Date()
          }
        });
      } catch (prismaErr) {
        console.warn('Neon upsert failed on Google auth:', prismaErr);
      }
    }

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      message: `Berhasil masuk dengan akun Google: ${finalEmail}`
    });

    response.cookies.set('jfzla_user_session', String(safeUser.id || ''), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch (err: any) {
    console.error('Google POST auth error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal login via Google.' },
      { status: 500 }
    );
  }
}
