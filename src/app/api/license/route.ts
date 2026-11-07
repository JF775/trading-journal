import { NextRequest, NextResponse } from 'next/server';
import {
  getUserLicense,
  activateLicenseKey,
  verifyAffiliateBroker,
  resetLicense,
  saveUsersToDisk,
  getAllUsers
} from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);
    const license = getUserLicense(user?.id);
    return NextResponse.json(license);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch license' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);
    const body = await request.json();
    const action = body.action || 'activate';

    if (action === 'activate') {
      if (!body.key) {
        return NextResponse.json(
          { error: 'Kunci lisensi (license key) wajib diisi' },
          { status: 400 }
        );
      }
      const result = activateLicenseKey(body.key, user?.name || body.owner_name);
      if (result.success && user) {
        user.role = 'client_pro';
        saveUsersToDisk(getAllUsers());
      }
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    if (action === 'verify_affiliate') {
      if (!body.broker || !body.account_number) {
        return NextResponse.json(
          { error: 'Pilih broker (Exness, HFM, Valetax) dan nomor akun trading' },
          { status: 400 }
        );
      }
      const result = verifyAffiliateBroker(body.broker, body.account_number, user?.name || body.owner_name);
      if (result.success && user) {
        user.role = 'client_affiliate';
        user.preferred_broker = body.broker;
        saveUsersToDisk(getAllUsers());
      }
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    if (action === 'reset') {
      // ONLY ADMIN can perform reset license test!
      if (!user || user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Fitur uji test reset lisensi hanya diperbolehkan untuk akun Administrator / Developer.' },
          { status: 403 }
        );
      }
      const license = resetLicense();
      return NextResponse.json({
        success: true,
        license,
        message: 'Lisensi berhasil direset ke Starter Gratis (Khusus Pengujian Admin).'
      });
    }

    return NextResponse.json({ error: 'Aksi lisensi tidak valid' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memproses aksi lisensi' },
      { status: 500 }
    );
  }
}
