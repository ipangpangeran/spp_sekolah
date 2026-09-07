import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, namaPosBayar, keterangan } = body;

    if (!id || !namaPosBayar) {
      return NextResponse.json({ error: 'ID dan Nama Pos Bayar wajib diisi' }, { status: 400 });
    }

    const pos = await prisma.posBayar.update({
      where: { id: parseInt(id) },
      data: { namaPosBayar, keterangan },
    });

    return NextResponse.json({ pos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID Pos Bayar wajib diisi' }, { status: 400 });
    }

    await prisma.posBayar.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
