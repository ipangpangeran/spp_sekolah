import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rateLimit';
import { sanitizeInput } from '@/lib/security';

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting Check (Anti Brute-Force)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const rateLimit = checkRateLimit(`login_${ip}`, 5, 60 * 1000); // 5 attempts per 60s

    if (!rateLimit.success) {
      const waitSeconds = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
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

    if (!user || user.password !== password) {
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

    // 3. Set Secure Session Cookie
    response.cookies.set('sisma_session', JSON.stringify({
      id: user.id,
      username: user.username,
      namaLengkap: user.namaLengkap,
      level: user.level,
      idTahunAjaran: activeTa?.id || user.idTahunAjaran,
      createdAt: Date.now(),
    }), {
      httpOnly: false, // Accessible by Next.js edge middleware & client state sync
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal login' }, { status: 500 });
  }
}
