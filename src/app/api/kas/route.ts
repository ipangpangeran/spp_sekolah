import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    if (startDate && endDate) {
      where.tgl = {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59'),
      };
    }

    const kasList = await prisma.kas.findMany({
      where,
      include: { user: true, posBayar: true },
      orderBy: { tgl: 'desc' },
    });

    const totalPemasukan = kasList.reduce((sum, k) => sum + k.pemasukan, 0);
    const totalPengeluaran = kasList.reduce((sum, k) => sum + k.pengeluaran, 0);
    const saldoKas = totalPemasukan - totalPengeluaran;

    return NextResponse.json({ kasList, totalPemasukan, totalPengeluaran, saldoKas });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Support multi-row or single row entry
    const items: Array<{ uraian: string; pengeluaran?: number; pemasukan?: number; jenis: 'masuk' | 'keluar'; idPosBayar?: number }> = Array.isArray(body.items) ? body.items : [body];
    const { idUser } = body;

    let userId = idUser;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst({ where: { level: 'bendahara' } });
      userId = defaultUser?.id || 1;
    }

    const createdEntries = [];
    for (const item of items) {
      if (!item.uraian) continue;
      const entry = await prisma.kas.create({
        data: {
          tgl: new Date(),
          uraian: item.uraian,
          pemasukan: item.pemasukan || 0,
          pengeluaran: item.pengeluaran || 0,
          jenis: item.jenis || 'keluar',
          idUser: userId,
          idPosBayar: item.idPosBayar || null,
        },
      });
      createdEntries.push(entry);
    }

    return NextResponse.json({ success: true, createdEntries });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
