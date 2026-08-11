import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalSiswa, totalKelas, kasToday, totalKasAll, recentKas] = await Promise.all([
      prisma.siswa.count({ where: { statusSiswa: 'AKTIF' } }),
      prisma.kelas.count(),
      prisma.kas.findMany({
        where: {
          tgl: { gte: today },
        },
      }),
      prisma.kas.findMany({
        where: { jenis: 'masuk' },
      }),
      prisma.kas.findMany({
        where: { jenis: 'masuk' },
        take: 10,
        orderBy: { tgl: 'desc' },
        include: { user: true },
      }),
    ]);

    const todayIncome = kasToday
      .filter((k) => k.jenis === 'masuk')
      .reduce((sum, k) => sum + k.pemasukan, 0);

    const totalIncome = totalKasAll.reduce((sum, k) => sum + k.pemasukan, 0);

    return NextResponse.json({
      totalSiswa,
      totalKelas,
      todayIncome,
      netBalance: totalIncome,
      recentTransactions: recentKas.map((k) => ({
        id: k.id,
        tgl: k.tgl,
        uraian: k.uraian,
        pemasukan: k.pemasukan,
        jenis: k.jenis,
        petugas: k.user?.namaLengkap || 'System',
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
