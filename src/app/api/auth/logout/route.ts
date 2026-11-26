import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/api-logger';

async function handlePost() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('sisma_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

export const POST = withApiLogging(handlePost, 'AUTH_LOGOUT');
