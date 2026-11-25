import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminSession } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  if (!isAdminSession()) {
    return NextResponse.json(
      { error: 'Akses ditolak. Hanya Administrator yang dapat mengakses pengaturan sistem.' },
      { status: 403 }
    );
  }

  try {
    let settings = await prisma.pengaturan.findFirst({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.pengaturan.create({ data: { id: 1 } });
    }
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAdminSession()) {
    return NextResponse.json(
      { error: 'Akses ditolak. Hanya Administrator yang dapat mengubah pengaturan sistem.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const allowedKeys = [
      'namaSekolah', 'npsn', 'alamat', 'telepon', 'email', 'website',
      'kepalaSekolah', 'nipKepalaSekolah', 'bendahara', 'nipBendahara',
      'logo', 'waApiUrl', 'waApiKey', 'midtransServerKey', 'midtransClientKey', 'midtransIsProduction'
    ];

    const cleanData: any = {};
    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        cleanData[key] = body[key];
      }
    }

    const settings = await prisma.pengaturan.upsert({
      where: { id: 1 },
      update: cleanData,
      create: { id: 1, ...cleanData },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menyimpan pengaturan' }, { status: 500 });
  }
}
