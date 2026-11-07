import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const isConfigured = Boolean(clientId && clientId.trim().length > 5);

  return NextResponse.json({
    configured: isConfigured,
    clientId: isConfigured ? clientId : ''
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, clientSecret } = body;

    const trimmedClientId = (clientId || '').trim();
    const trimmedSecret = (clientSecret || '').trim();

    if (!trimmedClientId) {
      return NextResponse.json(
        { success: false, error: 'Google Client ID tidak boleh kosong.' },
        { status: 400 }
      );
    }

    // Set in current process memory immediately
    process.env.GOOGLE_CLIENT_ID = trimmedClientId;
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = trimmedClientId;
    if (trimmedSecret) {
      process.env.GOOGLE_CLIENT_SECRET = trimmedSecret;
    }

    // Save to .env.local file
    const envPath = path.join(process.cwd(), '.env.local');
    let content = '';
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf-8');
    }

    const updates: Record<string, string> = {
      GOOGLE_CLIENT_ID: trimmedClientId,
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: trimmedClientId,
      ...(trimmedSecret ? { GOOGLE_CLIENT_SECRET: trimmedSecret } : {})
    };

    for (const [key, val] of Object.entries(updates)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${val}`);
      } else {
        content += `\n${key}=${val}`;
      }
    }

    fs.writeFileSync(envPath, content.trim() + '\n', 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Kredensial Google OAuth berhasil disimpan dan aktif!'
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menyimpan konfigurasi.' },
      { status: 500 }
    );
  }
}
