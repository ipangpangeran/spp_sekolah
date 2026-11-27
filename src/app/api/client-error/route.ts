import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/session';
import { writeErrorLog } from '@/lib/logger';
import { getClientIp } from '@/lib/api-logger';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const session = getSessionFromCookies();
    const ip = getClientIp(request);

    const message = String(body?.message || 'Unknown frontend error').slice(0, 1000);
    const stack = body?.stack ? String(body.stack).slice(0, 4000) : undefined;
    const pageUrl = body?.url ? String(body.url).slice(0, 500) : undefined;

    writeErrorLog({
      level: 'ERROR',
      source: 'frontend',
      event: String(body?.type || 'FRONTEND_RUNTIME_ERROR'),
      path: pageUrl,
      userId: session?.id ?? null,
      username: session?.username ?? null,
      role: session?.level ?? null,
      ip,
      error: message,
      stack,
    });

    return NextResponse.json({ logged: true });
  } catch {
    return NextResponse.json({ logged: false }, { status: 200 });
  }
}
