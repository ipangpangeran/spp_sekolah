import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalSiswa,
      totalKelas,
      kasTodayAgg,
      kasTotalAgg,
      bulananTodayAgg,
      bebasTodayAgg,
      bulananTotalAgg,
      bebasTotalAgg,
      recentKas,
      recentBulanan,
      recentBebas,
    ] = await Promise.all([
      prisma.siswa.count({ where: { statusSiswa: 'AKTIF' } }),
      prisma.kelas.count(),
      prisma.kas.aggregate({
        where: { jenis: 'masuk', tgl: { gte: today } },
        _sum: { pemasukan: true },
      }),
      prisma.kas.aggregate({
        where: { jenis: 'masuk' },
        _sum: { pemasukan: true },
      }),
      prisma.pembayaranBulanan.aggregate({
        where: { tglBayar: { gte: today } },
        _sum: { jumlahBayar: true },
      }),
      prisma.pembayaranBebas.aggregate({
        where: { tglBayar: { gte: today } },
        _sum: { jumlahBayar: true },
      }),
      prisma.pembayaranBulanan.aggregate({
        _sum: { jumlahBayar: true },
      }),
      prisma.pembayaranBebas.aggregate({
        _sum: { jumlahBayar: true },
      }),
      prisma.kas.findMany({
        where: { jenis: 'masuk' },
        take: 10,
        orderBy: { tgl: 'desc' },
        include: { user: true },
      }),
      prisma.pembayaranBulanan.findMany({
        take: 10,
        orderBy: { tglBayar: 'desc' },
        include: {
          user: true,
          tagihanBulanan: {
            include: { siswa: true },
          },
        },
      }),
      prisma.pembayaranBebas.findMany({
        take: 10,
        orderBy: { tglBayar: 'desc' },
        include: {
          user: true,
          tagihanBebas: {
            include: {
              siswa: true,
              jenisPembayaran: { include: { posBayar: true } },
            },
          },
        },
      }),
    ]);

    const todayIncome =
      Number(kasTodayAgg._sum.pemasukan || 0) +
      Number(bulananTodayAgg._sum.jumlahBayar || 0) +
      Number(bebasTodayAgg._sum.jumlahBayar || 0);

    const totalPaymentIncome =
      Number(bulananTotalAgg._sum.jumlahBayar || 0) +
      Number(bebasTotalAgg._sum.jumlahBayar || 0);

    const totalKasIncome = Number(kasTotalAgg._sum.pemasukan || 0);

    const recentTransactions = [
      ...recentBulanan.map((b) => ({
        id: `pb-${b.id}`,
        tgl: b.tglBayar,
        uraian: `SPP ${b.tagihanBulanan.bulan} - ${b.tagihanBulanan.siswa.namaSiswa}`,
        pemasukan: b.jumlahBayar,
        jenis: 'masuk',
        petugas: b.user?.namaLengkap || 'System',
      })),
      ...recentBebas.map((b) => ({
        id: `pbb-${b.id}`,
        tgl: b.tglBayar,
        uraian: `${b.tagihanBebas.jenisPembayaran?.posBayar?.namaPosBayar || 'Pembayaran'} - ${b.tagihanBebas.siswa.namaSiswa}`,
        pemasukan: b.jumlahBayar,
        jenis: 'masuk',
        petugas: b.user?.namaLengkap || 'System',
      })),
      ...recentKas.map((k) => ({
        id: `kas-${k.id}`,
        tgl: k.tgl,
        uraian: k.uraian,
        pemasukan: k.pemasukan,
        jenis: k.jenis,
        petugas: k.user?.namaLengkap || 'System',
      })),
    ]
      .sort((a, b) => new Date(b.tgl).getTime() - new Date(a.tgl).getTime())
      .slice(0, 10);

    return NextResponse.json({
      totalSiswa,
      totalKelas,
      todayIncome,
      totalPaymentIncome,
      totalKasIncome,
      netBalance: totalPaymentIncome + totalKasIncome,
      recentTransactions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
