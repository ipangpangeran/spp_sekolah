import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rateLimit';
import { sanitizeInput } from '@/lib/security';
import { verifyPassword } from '@/lib/password';
import { signSessionToken } from '@/lib/auth-token';
import { writeAccessLog, writeAuditLog, writeErrorLog } from '@/lib/logger';
import { getClientIp } from '@/lib/api-logger';

export async function POST(request: Request) {
  const start = Date.now();
  const ip = getClientIp(request);
  try {
    // 1. Rate Limiting Check (Anti Brute-Force, Cloudflare-aware)
    const rateLimit = checkRateLimit(`login_${ip}`, 5, 60 * 1000); // 5 attempts per 60s

    if (!rateLimit.success) {
      const waitSeconds = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      const durationMs = Date.now() - start;
      const entry = {
        level: 'WARN' as const,
        event: 'AUTH_RATE_LIMIT',
        method: 'POST',
        path: '/api/auth/login',
        status: 429,
        durationMs,
        slow: false,
        ip,
      };
      writeAccessLog(entry);
      writeAuditLog(entry);
      return NextResponse.json(
        { error: `Terlalu banyak percobaan login gagal. Harap tunggu ${waitSeconds} detik lagi.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const username = sanitizeInput(body.username);
    const password = String(body.password || '').trim();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan Password wajib diisi' }, { status: 400 });
    }

    // 2. Find user in database
    const user = await prisma.user.findUnique({
      where: { username },
      include: { tahunAjaran: true },
    });

    if (!user || !verifyPassword(password, user.password)) {
      const durationMs = Date.now() - start;
      const entry = {
        level: 'WARN' as const,
        event: 'AUTH_LOGIN_FAILED',
        method: 'POST',
        path: '/api/auth/login',
        status: 401,
        durationMs,
        slow: false,
        username,
        ip,
      };
      writeAccessLog(entry);
      writeAuditLog(entry);
      return NextResponse.json({ error: 'Username atau Password salah' }, { status: 401 });
    }

    const activeTa = await prisma.tahunAjaran.findFirst({ where: { status: 'AKTIF' } });

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        namaLengkap: user.namaLengkap,
        level: user.level,
        idTahunAjaran: activeTa?.id || user.idTahunAjaran,
        tahunAjaran: activeTa?.tahunAjaran || '2026/2027',
      },
    });

    // 3. Set Signed HttpOnly Session Cookie
    const signedToken = await signSessionToken({
      id: user.id,
      username: user.username,
      namaLengkap: user.namaLengkap,
      level: user.level,
      idTahunAjaran: activeTa?.id || user.idTahunAjaran,
      createdAt: Date.now(),
    });

    response.cookies.set('sisma_session', signedToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    const durationMs = Date.now() - start;
    const entry = {
      level: 'INFO' as const,
      event: 'AUTH_LOGIN_SUCCESS',
      method: 'POST',
      path: '/api/auth/login',
      status: 200,
      durationMs,
      slow: durationMs >= 500,
      userId: user.id,
      username: user.username,
      role: user.level,
      ip,
    };
    writeAccessLog(entry);
    writeAuditLog(entry);

    return response;
  } catch (error: any) {
    const durationMs = Date.now() - start;
    writeAccessLog({
      level: 'ERROR',
      event: 'AUTH_LOGIN_ERROR',
      method: 'POST',
      path: '/api/auth/login',
      status: 500,
      durationMs,
      ip,
    });
    writeErrorLog({
      level: 'ERROR',
      source: 'backend',
      event: 'AUTH_LOGIN_ERROR',
      method: 'POST',
      path: '/api/auth/login',
      status: 500,
      durationMs,
      ip,
      error: error?.message || 'Gagal login',
      stack: error?.stack,
    });
    return NextResponse.json({ error: error.message || 'Gagal login' }, { status: 500 });
  }
}
