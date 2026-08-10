import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const kelasList = await prisma.kelas.findMany({
      include: {
        _count: {
          select: { siswa: true },
        },
      },
      orderBy: { namaKelas: 'asc' },
    });
    return NextResponse.json({ kelasList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { namaKelas, keterangan } = body;

    if (!namaKelas) {
      return NextResponse.json({ error: 'Nama kelas wajib diisi' }, { status: 400 });
    }

    const kelas = await prisma.kelas.create({
      data: { namaKelas, keterangan },
    });

    return NextResponse.json({ kelas });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
