import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Berhasil keluar.'
  });

  response.cookies.delete('jfzla_user_session');
  return response;
}
