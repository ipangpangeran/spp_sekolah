import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const jenisList = await prisma.jenisPembayaran.findMany({
      include: {
        posBayar: true,
        tahunAjaran: true,
      },
      orderBy: { id: 'desc' },
    });
    return NextResponse.json({ jenisList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idPosBayar, idTahunAjaran, tipeBayar } = body;

    if (!idPosBayar || !idTahunAjaran) {
      return NextResponse.json({ error: 'Pos Bayar dan Tahun Ajaran wajib diisi' }, { status: 400 });
    }

    const jenis = await prisma.jenisPembayaran.create({
      data: {
        idPosBayar: parseInt(idPosBayar),
        idTahunAjaran: parseInt(idTahunAjaran),
        tipeBayar: tipeBayar || 'bulanan',
      },
      include: { posBayar: true, tahunAjaran: true },
    });

    return NextResponse.json({ jenis });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
