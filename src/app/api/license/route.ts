import { NextRequest, NextResponse } from 'next/server';
import {
  getUserLicense,
  activateLicenseKey,
  verifyAffiliateBroker,
  resetLicense,
  saveUsersToDisk,
  getAllUsers,
  findUserById
} from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { prisma, hasNeonDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    let user = getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || request.headers.get('x-user-id') || user?.id;

    if (!user && userId) {
      user = findUserById(userId) || null;
      if (!user && hasNeonDatabase()) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { id: userId } });
          if (dbUser) {
            user = {
              id: dbUser.id,
              name: dbUser.name,
              email: dbUser.email,
              avatar: dbUser.avatar || undefined,
              provider: dbUser.provider as any,
              role: dbUser.role as any,
              preferred_broker: (dbUser.preferred_broker as any) || 'Exness',
              created_at: dbUser.created_at.toISOString(),
              last_login: dbUser.last_login?.toISOString()
            };
          }
        } catch (e) {
          console.warn('Prisma lookup failed in license GET:', e);
        }
      }
    }

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
    let user = getAuthenticatedUser(request);
    const body = await request.json();
    const action = body.action || 'activate';

    if (!user && body.userId) {
      user = findUserById(body.userId) || null;
      if (!user && hasNeonDatabase()) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { id: body.userId } });
          if (dbUser) {
            user = {
              id: dbUser.id,
              name: dbUser.name,
              email: dbUser.email,
              avatar: dbUser.avatar || undefined,
              provider: dbUser.provider as any,
              role: dbUser.role as any,
              preferred_broker: (dbUser.preferred_broker as any) || 'Exness',
              created_at: dbUser.created_at.toISOString(),
              last_login: dbUser.last_login?.toISOString()
            };
          }
        } catch (e) {
          console.warn('Prisma user lookup failed in license POST:', e);
        }
      }
    }

    if (action === 'activate') {
      if (!body.key) {
        return NextResponse.json(
          { error: 'Kunci lisensi (license key) wajib diisi' },
          { status: 400 }
        );
      }
      const result = activateLicenseKey(body.key, user?.name || body.owner_name);
      if (result.success) {
        const newRole = 'client_pro';
        if (user) {
          user.role = newRole;
          const allUsers = getAllUsers();
          const target = allUsers.find(u => u.id === user?.id || u.email === user?.email);
          if (target) {
            target.role = newRole;
          }
          saveUsersToDisk(allUsers);

          if (hasNeonDatabase() && user.id) {
            try {
              await prisma.user.update({
                where: { id: user.id },
                data: { role: newRole }
              });
            } catch (neonErr) {
              console.warn('Neon database user role update failed:', neonErr);
            }
          }
        }

        const safeUser = user ? { ...user, role: newRole } : null;
        if (safeUser) delete safeUser.password_hash;

        return NextResponse.json({
          success: true,
          message: result.message,
          license: result.license,
          user: safeUser
        }, { status: 200 });
      }

      return NextResponse.json(result, { status: 400 });
    }

    if (action === 'verify_affiliate') {
      if (!body.broker || !body.account_number) {
        return NextResponse.json(
          { error: 'Pilih broker (Exness, HFM, Valetax) dan nomor akun trading' },
          { status: 400 }
        );
      }
      const result = verifyAffiliateBroker(body.broker, body.account_number, user?.name || body.owner_name);
      if (result.success) {
        const newRole = 'client_affiliate';
        if (user) {
          user.role = newRole;
          user.preferred_broker = body.broker;
          const allUsers = getAllUsers();
          const target = allUsers.find(u => u.id === user?.id || u.email === user?.email);
          if (target) {
            target.role = newRole;
            target.preferred_broker = body.broker;
          }
          saveUsersToDisk(allUsers);

          if (hasNeonDatabase() && user.id) {
            try {
              await prisma.user.update({
                where: { id: user.id },
                data: { role: newRole, preferred_broker: body.broker }
              });
            } catch (neonErr) {
              console.warn('Neon database affiliate update failed:', neonErr);
            }
          }
        }

        const safeUser = user ? { ...user, role: newRole, preferred_broker: body.broker } : null;
        if (safeUser) delete safeUser.password_hash;

        return NextResponse.json({
          success: true,
          message: result.message,
          license: result.license,
          user: safeUser
        }, { status: 200 });
      }

      return NextResponse.json(result, { status: 400 });
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
      const newRole = 'client_starter';
      user.role = newRole;
      const allUsers = getAllUsers();
      const target = allUsers.find(u => u.id === user?.id || u.email === user?.email);
      if (target) {
        target.role = newRole;
      }
      saveUsersToDisk(allUsers);

      if (hasNeonDatabase() && user.id) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: newRole }
          });
        } catch (neonErr) {
          console.warn('Neon database reset role update failed:', neonErr);
        }
      }

      const safeUser = { ...user, role: newRole };
      delete safeUser.password_hash;

      return NextResponse.json({
        success: true,
        license,
        user: safeUser,
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
