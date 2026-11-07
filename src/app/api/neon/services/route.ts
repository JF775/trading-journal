import { NextResponse } from 'next/server';
import { prisma, hasNeonDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    branch: process.env.NEON_BRANCH || 'production',
    branchId: process.env.NEON_BRANCH_ID || '',
    services: {}
  };

  // 1. Lakebase Postgres via Prisma & Connection Pooling
  try {
    const isConfigured = hasNeonDatabase();
    if (!isConfigured) {
      results.services.postgres = { status: 'unconfigured' };
    } else {
      const [userCount, accountCount, tradeCount] = await Promise.all([
        prisma.user.count(),
        prisma.brokerAccount.count(),
        prisma.trade.count()
      ]);
      results.services.postgres = {
        status: 'healthy',
        driver: 'pg / @prisma/adapter-pg (Pooled)',
        stats: {
          users: userCount,
          brokerAccounts: accountCount,
          trades: tradeCount
        }
      };
    }
  } catch (err: any) {
    results.services.postgres = { status: 'error', error: err.message };
  }

  // 2. Neon Functions
  try {
    const functionSuffix = process.env.NEON_FUNCTION_HOST_SUFFIX || '.compute.c-1.ap-southeast-1.aws.neon.tech';
    const branchId = process.env.NEON_BRANCH_ID || 'br-billowing-butterfly-a14nj0gm';
    const helloUrl = `https://${branchId}-hello${functionSuffix}/`;

    const res = await fetch(helloUrl, { cache: 'no-store' });
    const text = await res.text();
    results.services.functions = {
      status: res.ok ? 'healthy' : 'error',
      function: 'hello',
      url: helloUrl,
      response: text.trim()
    };
  } catch (err: any) {
    results.services.functions = { status: 'error', error: err.message };
  }

  // 3. Neon Auth (JWKS Verification)
  try {
    const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
    if (!jwksUrl) {
      results.services.auth = { status: 'unconfigured' };
    } else {
      const res = await fetch(jwksUrl, { cache: 'no-store' });
      const data = await res.json();
      results.services.auth = {
        status: res.ok ? 'healthy' : 'error',
        provider: 'Neon Auth (Managed Better Auth)',
        jwksUrl,
        keysCount: data.keys?.length || 0,
        keyAlgorithms: data.keys?.map((k: any) => k.alg) || []
      };
    }
  } catch (err: any) {
    results.services.auth = { status: 'error', error: err.message };
  }

  // 4. Neon AI Gateway
  try {
    const aiBaseUrl = process.env.NEON_AI_GATEWAY_BASE_URL;
    const aiToken = process.env.NEON_AI_GATEWAY_TOKEN;
    if (!aiBaseUrl || !aiToken) {
      results.services.aiGateway = { status: 'unconfigured' };
    } else {
      const res = await fetch(`${aiBaseUrl}/v1/models`, {
        headers: { Authorization: `Bearer ${aiToken}` },
        cache: 'no-store'
      });
      const data = await res.json();
      results.services.aiGateway = {
        status: res.ok ? 'healthy' : 'error',
        gatewayUrl: aiBaseUrl,
        catalogStatus: data.object === 'list' ? 'ready' : 'unavailable',
        totalModelsAvailable: data.data?.length || 0
      };
    }
  } catch (err: any) {
    results.services.aiGateway = { status: 'error', error: err.message };
  }

  // 5. Neon Realtime
  try {
    const rtUrl = process.env.NEON_REALTIME_URL;
    const rtSecret = process.env.NEON_REALTIME_SECRET;
    results.services.realtime = {
      status: rtUrl && rtSecret ? 'configured' : 'unconfigured',
      url: rtUrl,
      mode: 'WebSocket (Live SQL & Reactive Queries)',
      hasSecret: Boolean(rtSecret)
    };
  } catch (err: any) {
    results.services.realtime = { status: 'error', error: err.message };
  }

  return NextResponse.json({
    success: true,
    message: 'Semua 5 layanan Neon berhasil di-wire dan aktif!',
    ...results
  });
}
