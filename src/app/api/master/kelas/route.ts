import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, namaKelas, keterangan } = body;

    if (!id || !namaKelas) {
      return NextResponse.json({ error: 'ID dan Nama kelas wajib diisi' }, { status: 400 });
    }

    const kelas = await prisma.kelas.update({
      where: { id: parseInt(id) },
      data: { namaKelas, keterangan },
    });

    return NextResponse.json({ kelas });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID Kelas wajib diisi' }, { status: 400 });
    }

    const targetId = parseInt(id);
    const studentCount = await prisma.siswa.count({ where: { idKelas: targetId } });
    if (studentCount > 0) {
      return NextResponse.json(
        { error: `Tidak dapat menghapus kelas karena masih ada ${studentCount} siswa terdaftar di dalamnya.` },
        { status: 400 }
      );
    }

    await prisma.kelas.delete({ where: { id: targetId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
