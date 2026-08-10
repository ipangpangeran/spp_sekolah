import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tahunAjaranList = await prisma.tahunAjaran.findMany({
      orderBy: { id: 'desc' },
    });
    return NextResponse.json({ tahunAjaranList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tahunAjaran, setAktif } = body;

    if (!tahunAjaran) {
      return NextResponse.json({ error: 'Tahun ajaran wajib diisi (misal: 2026/2027)' }, { status: 400 });
    }

    if (setAktif) {
      await prisma.tahunAjaran.updateMany({
        data: { status: 'TIDAK_AKTIF' },
      });
    }

    const newTa = await prisma.tahunAjaran.create({
      data: {
        tahunAjaran,
        status: setAktif ? 'AKTIF' : 'TIDAK_AKTIF',
      },
    });

    return NextResponse.json({ tahunAjaran: newTa });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });
    }

    // Set all to TIDAK_AKTIF
    await prisma.tahunAjaran.updateMany({
      data: { status: 'TIDAK_AKTIF' },
    });

    // Set selected to AKTIF
    const ta = await prisma.tahunAjaran.update({
      where: { id: parseInt(id) },
      data: { status: 'AKTIF' },
    });

    return NextResponse.json({ tahunAjaran: ta });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
