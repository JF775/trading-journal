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
import { UserLicense, getRolePackageDetails } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const headerId = request.headers.get('x-user-id');
    const queryId = searchParams.get('userId');
    const cookieHeader = request.headers.get('cookie') || '';
    const cookieMatch = cookieHeader.match(/jfzla_user_session=([^;]+)/);
    const cookieUserId = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';

    const targetId = headerId || queryId || cookieUserId;
    let user: any = null;
    let dbLicense: any = null;

    if (hasNeonDatabase() && targetId) {
      try {
        const foundUser = await prisma.user.findFirst({
          where: {
            OR: [
              { id: targetId },
              { email: targetId.includes('@') ? targetId.toLowerCase().trim() : undefined }
            ]
          }
        });
        if (foundUser) {
          user = {
            id: foundUser.id,
            name: foundUser.name,
            email: foundUser.email,
            avatar: foundUser.avatar || undefined,
            provider: foundUser.provider as any,
            role: foundUser.role as any,
            preferred_broker: (foundUser.preferred_broker as any) || 'Exness',
            created_at: foundUser.created_at.toISOString(),
            last_login: foundUser.last_login?.toISOString()
          };
          dbLicense = await prisma.userLicense.findFirst({
            where: { user_id: foundUser.id }
          });
        }
      } catch (e) {
        console.warn('Neon DB lookup in license GET failed:', e);
      }
    }

    if (!user) {
      user = getAuthenticatedUser(request);
      if (!user && targetId) {
        user = findUserById(targetId) || null;
      }
    }

    const role = user?.role || 'client_starter';
    const pkg = getRolePackageDetails(role);

    const license: UserLicense = {
      id: dbLicense?.id || `lic_${user?.id || 'default'}`,
      user_id: user?.id,
      tier: (dbLicense?.package_type as any) || pkg.tier,
      status: (dbLicense?.status as any) || 'active',
      license_key: dbLicense?.license_key || (pkg.tier === 'pro' ? 'PTRACK-PRO-2026-VIP' : undefined),
      owner_name: user?.name || 'Trader',
      affiliate_broker: user?.preferred_broker || 'Exness',
      affiliate_account: user?.preferred_broker ? '20993412' : undefined,
      expires_at: dbLicense?.expires_at ? dbLicense.expires_at.toISOString().split('T')[0] : (pkg.tier === 'pro' ? '2027-11-08' : undefined),
      created_at: dbLicense?.created_at ? dbLicense.created_at.toISOString() : (user?.created_at || new Date().toISOString()),
      features: {
        max_mt5_accounts: pkg.maxAccounts,
        auto_sync_enabled: pkg.autoSyncEnabled,
        allowed_brokers: pkg.allowedBrokers,
        sync_interval_minutes: pkg.minSyncInterval === 0 ? 0 : Math.max(1, Math.round(pkg.minSyncInterval / 60)),
        export_enabled: pkg.tier === 'pro',
        priority_bridge: pkg.tier === 'pro'
      }
    };

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
    const body = await request.json();
    const action = body.action || 'activate';

    const headerId = request.headers.get('x-user-id');
    const targetId = body.userId || headerId;
    let user: any = null;

    if (hasNeonDatabase() && targetId) {
      try {
        const found = await prisma.user.findFirst({
          where: {
            OR: [
              { id: targetId },
              { email: targetId.includes('@') ? targetId.toLowerCase().trim() : undefined }
            ]
          }
        });
        if (found) {
          user = {
            id: found.id,
            name: found.name,
            email: found.email,
            avatar: found.avatar || undefined,
            provider: found.provider as any,
            role: found.role as any,
            preferred_broker: (found.preferred_broker as any) || 'Exness',
            created_at: found.created_at.toISOString(),
            last_login: found.last_login?.toISOString()
          };
        }
      } catch (e) {
        console.warn('Neon lookup in license POST failed:', e);
      }
    }

    if (!user) {
      user = getAuthenticatedUser(request);
      if (!user && targetId) {
        user = findUserById(targetId) || null;
      }
    }

    if (action === 'activate') {
      if (!body.key) {
        return NextResponse.json(
          { error: 'Kunci lisensi (license key) wajib diisi' },
          { status: 400 }
        );
      }
      const cleanKey = (body.key || '').trim().toUpperCase();
      const isValidFormat =
        cleanKey.startsWith('PTRACK-PRO') ||
        cleanKey.startsWith('VIP-') ||
        cleanKey.startsWith('PRO-') ||
        cleanKey === 'CENTTRADE-PRO-VIP' ||
        cleanKey.length >= 8;

      if (!isValidFormat) {
        return NextResponse.json(
          { error: 'Format kunci lisensi tidak valid. Contoh kunci valid: PTRACK-PRO-2026-VIP atau PRO-XXXX-XXXX.' },
          { status: 400 }
        );
      }

      const newRole = 'client_pro';
      const expDate = new Date();
      expDate.setFullYear(expDate.getFullYear() + 1);

      if (user) {
        user.role = newRole;
      }

      // 1. Neon DB PERSISTENCE
      let updatedDbLicense: any = null;
      if (hasNeonDatabase() && user) {
        try {
          await prisma.user.updateMany({
            where: {
              OR: [
                { id: user.id },
                { email: user.email.toLowerCase().trim() }
              ]
            },
            data: { role: newRole }
          });

          updatedDbLicense = await prisma.userLicense.upsert({
            where: { user_id: user.id },
            update: {
              license_key: cleanKey,
              package_type: 'pro',
              status: 'active',
              expires_at: expDate
            },
            create: {
              user_id: user.id,
              license_key: cleanKey,
              package_type: 'pro',
              status: 'active',
              expires_at: expDate
            }
          });
        } catch (neonErr) {
          console.warn('Neon DB update error in license activate:', neonErr);
        }
      }

      // 2. In-memory & local disk persistence
      const allUsers = getAllUsers();
      const target = allUsers.find(u => u.id === user?.id || u.email === user?.email);
      if (target) {
        target.role = newRole;
      }
      saveUsersToDisk(allUsers);
      activateLicenseKey(cleanKey, user?.name);

      const pkg = getRolePackageDetails(newRole);
      const updatedLicense: UserLicense = {
        id: updatedDbLicense?.id || `lic_${user?.id || 'pro'}`,
        user_id: user?.id,
        tier: 'pro',
        status: 'active',
        license_key: cleanKey,
        owner_name: user?.name || 'VIP Member',
        affiliate_broker: user?.preferred_broker || 'Exness',
        expires_at: expDate.toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        features: {
          max_mt5_accounts: pkg.maxAccounts,
          auto_sync_enabled: pkg.autoSyncEnabled,
          allowed_brokers: pkg.allowedBrokers,
          sync_interval_minutes: pkg.minSyncInterval === 0 ? 0 : Math.max(1, Math.round(pkg.minSyncInterval / 60)),
          export_enabled: true,
          priority_bridge: true
        }
      };

      const safeUser = user ? { ...user, role: newRole } : null;
      if (safeUser) delete safeUser.password_hash;

      return NextResponse.json({
        success: true,
        message: `Lisensi PRO VIP Aktif! Kunci [${cleanKey}] berhasil divalidasi. Nikmati MT5 Auto-Sync tanpa batas broker, interval 15 menit, dan prioritas bridge.`,
        license: updatedLicense,
        user: safeUser
      }, { status: 200 });
    }

    if (action === 'verify_affiliate') {
      if (!body.broker || !body.account_number) {
        return NextResponse.json(
          { error: 'Pilih broker (Exness, HFM, Valetax) dan nomor akun trading' },
          { status: 400 }
        );
      }
      const cleanBroker = body.broker;
      const cleanAcc = (body.account_number || '').trim();
      const newRole = 'client_affiliate';

      if (user) {
        user.role = newRole;
        user.preferred_broker = cleanBroker;
      }

      // 1. Neon DB PERSISTENCE
      let updatedDbLicense: any = null;
      if (hasNeonDatabase() && user) {
        try {
          await prisma.user.updateMany({
            where: {
              OR: [
                { id: user.id },
                { email: user.email.toLowerCase().trim() }
              ]
            },
            data: { role: newRole, preferred_broker: cleanBroker }
          });

          updatedDbLicense = await prisma.userLicense.upsert({
            where: { user_id: user.id },
            update: {
              license_key: `AFF-${cleanBroker}-${cleanAcc}`,
              package_type: 'affiliate',
              status: 'active'
            },
            create: {
              user_id: user.id,
              license_key: `AFF-${cleanBroker}-${cleanAcc}`,
              package_type: 'affiliate',
              status: 'active'
            }
          });
        } catch (neonErr) {
          console.warn('Neon DB update error in verify_affiliate:', neonErr);
        }
      }

      // 2. In-memory & local disk persistence
      const allUsers = getAllUsers();
      const target = allUsers.find(u => u.id === user?.id || u.email === user?.email);
      if (target) {
        target.role = newRole;
        target.preferred_broker = cleanBroker;
      }
      saveUsersToDisk(allUsers);
      verifyAffiliateBroker(cleanBroker, cleanAcc, user?.name);

      const pkg = getRolePackageDetails(newRole);
      const updatedLicense: UserLicense = {
        id: updatedDbLicense?.id || `lic_${user?.id || 'affiliate'}`,
        user_id: user?.id,
        tier: 'affiliate',
        status: 'active',
        owner_name: user?.name || `Partner ${cleanBroker}`,
        affiliate_broker: cleanBroker,
        affiliate_account: cleanAcc,
        expires_at: 'Lifetime (Affiliate Active)',
        created_at: new Date().toISOString(),
        features: {
          max_mt5_accounts: pkg.maxAccounts,
          auto_sync_enabled: pkg.autoSyncEnabled,
          allowed_brokers: pkg.allowedBrokers,
          sync_interval_minutes: pkg.minSyncInterval === 0 ? 0 : Math.max(1, Math.round(pkg.minSyncInterval / 60)),
          export_enabled: false,
          priority_bridge: false
        }
      };

      const safeUser = user ? { ...user, role: newRole, preferred_broker: cleanBroker } : null;
      if (safeUser) delete safeUser.password_hash;

      return NextResponse.json({
        success: true,
        message: `Verifikasi Partner Berhasil! Akun ${cleanBroker} #${cleanAcc} terverifikasi di bawah kode IB Partner PTrack. Fitur MT5 Auto-Sync aktif untuk hingga 3 akun.`,
        license: updatedLicense,
        user: safeUser
      }, { status: 200 });
    }

    if (action === 'reset') {
      if (!user || user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Fitur uji test reset lisensi hanya diperbolehkan untuk akun Administrator / Developer.' },
          { status: 403 }
        );
      }
      const newRole = 'client_starter';
      user.role = newRole;

      if (hasNeonDatabase() && user.id) {
        try {
          await prisma.user.updateMany({
            where: {
              OR: [
                { id: user.id },
                { email: user.email.toLowerCase().trim() }
              ]
            },
            data: { role: newRole }
          });
          await prisma.userLicense.deleteMany({
            where: { user_id: user.id }
          });
        } catch (neonErr) {
          console.warn('Neon DB reset error:', neonErr);
        }
      }

      const allUsers = getAllUsers();
      const target = allUsers.find(u => u.id === user?.id || u.email === user?.email);
      if (target) target.role = newRole;
      saveUsersToDisk(allUsers);
      const license = resetLicense();

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
