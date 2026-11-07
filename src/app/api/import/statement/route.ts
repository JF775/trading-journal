import { NextRequest, NextResponse } from 'next/server';
import { parseStatement, getAllTrades } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);
    let content = '';
    let accountId = '';
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      content = body.statement_content || body.content || '';
      accountId = body.account_id || '';
    } else {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      accountId = (formData.get('account_id') as string) || '';
      if (file) {
        content = await file.text();
      }
    }

    if (!content) {
      return NextResponse.json({ error: 'Tidak ada konten statement yang diberikan.' }, { status: 400 });
    }

    const imported = parseStatement(content, 'Imported Statement', user?.id, accountId || undefined);
    const total = getAllTrades({ userId: user?.id }).length;

    return NextResponse.json({
      status: 'success',
      imported_count: imported.length,
      imported_trades: imported.length,
      total_trades: total,
      message: `Berhasil mengimpor ${imported.length} transaksi dari statement ke akun Anda.`
    });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memproses file statement' }, { status: 500 });
  }
}
