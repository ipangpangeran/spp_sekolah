import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rateLimit';
import { sanitizeInput } from '@/lib/security';
import { verifyPassword } from '@/lib/password';
import { signSessionToken } from '@/lib/auth-token';
import { writeAppLog } from '@/lib/logger';
import { getClientIp } from '@/lib/api-logger';

export async function POST(request: Request) {
  const start = Date.now();
  const ip = getClientIp(request);
  try {
    // 1. Rate Limiting Check (Anti Brute-Force, Cloudflare-aware)
    const rateLimit = checkRateLimit(`login_${ip}`, 5, 60 * 1000); // 5 attempts per 60s

    if (!rateLimit.success) {
      const waitSeconds = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      writeAppLog({
        level: 'WARN',
        event: 'AUTH_RATE_LIMIT',
        method: 'POST',
        path: '/api/auth/login',
        status: 429,
        durationMs: Date.now() - start,
        ip,
      });
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
      writeAppLog({
        level: 'WARN',
        event: 'AUTH_LOGIN_FAILED',
        method: 'POST',
        path: '/api/auth/login',
        status: 401,
        durationMs: Date.now() - start,
        username,
        ip,
      });
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

    writeAppLog({
      level: 'INFO',
      event: 'AUTH_LOGIN_SUCCESS',
      method: 'POST',
      path: '/api/auth/login',
      status: 200,
      durationMs: Date.now() - start,
      userId: user.id,
      username: user.username,
      role: user.level,
      ip,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal login' }, { status: 500 });
  }
}
