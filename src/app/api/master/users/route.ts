import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, username, password, namaLengkap, level } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID User wajib diisi' }, { status: 400 });
    }

    const updateData: any = {
      username,
      namaLengkap,
      level,
    };

    if (password) {
      updateData.password = password;
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID User wajib diisi' }, { status: 400 });
    }

    const targetId = parseInt(id);
    // Prevent deleting the main admin account (id 1 or admin) if last user
    const totalUsers = await prisma.user.count();
    if (totalUsers <= 1) {
      return NextResponse.json({ error: 'Tidak dapat menghapus satu-satunya akun pengguna' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: targetId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
