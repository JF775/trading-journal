import { NextRequest, NextResponse } from 'next/server';
import { authenticateWithGoogle } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const origin = request.nextUrl.origin;

  if (error) {
    console.warn('Google OAuth returned error:', error);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(`Login Google dibatalkan: ${error}`)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Kode otorisasi Google tidak ditemukan.')}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${origin}/api/auth/google/callback`;

  if (!clientId) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('GOOGLE_CLIENT_ID belum dikonfigurasi.')}`);
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }),
      cache: 'no-store'
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Google token exchange failed:', tokenData);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(tokenData.error_description || 'Gagal memvalidasi token dari Google.')}`
      );
    }

    // 2. Retrieve verified user profile from Google UserInfo endpoint
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      cache: 'no-store'
    });

    const profile = await userinfoRes.json();

    if (!profile.email) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Alamat email Google tidak ditemukan pada profil.')}`
      );
    }

    // 3. Authenticate or create user in database with Real Google data
    const result = authenticateWithGoogle(
      profile.email,
      profile.name || profile.given_name || profile.email.split('@')[0],
      profile.picture
    );

    const safeUser = { ...result.user };
    delete safeUser.password_hash;

    // 4. Set session cookie and redirect to dashboard
    const response = NextResponse.redirect(`${origin}/`);
    response.cookies.set('jfzla_user_session', String(safeUser.id || ''), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch (err: any) {
    console.error('Google callback exception:', err);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(err.message || 'Terjadi kesalahan sistem saat autentikasi Google.')}`
    );
  }
}
