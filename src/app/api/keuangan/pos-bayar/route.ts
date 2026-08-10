import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const posList = await prisma.posBayar.findMany({
      orderBy: { id: 'asc' },
    });
    return NextResponse.json({ posList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { namaPosBayar, keterangan } = body;

    if (!namaPosBayar) {
      return NextResponse.json({ error: 'Nama Pos Bayar wajib diisi' }, { status: 400 });
    }

    const pos = await prisma.posBayar.create({
      data: { namaPosBayar, keterangan },
    });

    return NextResponse.json({ pos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
