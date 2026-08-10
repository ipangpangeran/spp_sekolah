import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: { tahunAjaran: true },
      orderBy: { username: 'asc' },
    });
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, namaLengkap, level } = body;

    if (!username || !password || !namaLengkap) {
      return NextResponse.json({ error: 'Data user tidak lengkap' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: `Username '${username}' sudah digunakan` }, { status: 400 });
    }

    const activeTa = await prisma.tahunAjaran.findFirst({ where: { status: 'AKTIF' } });

    const user = await prisma.user.create({
      data: {
        username,
        password,
        namaLengkap,
        level: level || 'bendahara',
        idTahunAjaran: activeTa?.id || null,
      },
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
