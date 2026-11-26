import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildWibDateRange, getWibStartOfDay } from '@/lib/date';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let datesNormalized = false;

async function ensureEpochDates() {
  if (datesNormalized) return;
  await Promise.all([
    prisma.$executeRawUnsafe(
      `UPDATE PembayaranBulanan SET tglBayar = CAST(ROUND((julianday(tglBayar) - 2440587.5) * 86400000) AS INTEGER) WHERE typeof(tglBayar) = 'text'`
    ),
    prisma.$executeRawUnsafe(
      `UPDATE PembayaranBebas SET tglBayar = CAST(ROUND((julianday(tglBayar) - 2440587.5) * 86400000) AS INTEGER) WHERE typeof(tglBayar) = 'text'`
    ),
    prisma.$executeRawUnsafe(
      `UPDATE Kas SET tgl = CAST(ROUND((julianday(tgl) - 2440587.5) * 86400000) AS INTEGER) WHERE typeof(tgl) = 'text'`
    ),
  ]);
  datesNormalized = true;
}

export async function GET(request: Request) {
  try {
    await ensureEpochDates();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10) || 10));
    const period = searchParams.get('period') || 'all';
    const dateRange = buildWibDateRange(
      period,
      searchParams.get('startDate'),
      searchParams.get('endDate')
    );

    const today = getWibStartOfDay(0);
    const endOfToday = new Date(today.getTime() + 86400000 - 1);
    const todayRange = { gte: today, lte: endOfToday };

    const fetchWindow = page * limit;
    const kasTxWhere = { jenis: 'masuk', ...(dateRange ? { tgl: dateRange } : {}) };
    const payTxWhere = dateRange ? { tglBayar: dateRange } : undefined;

    const [
      totalSiswa,
      totalKelas,
      kasTodayAgg,
      kasTotalAgg,
      bulananTodayAgg,
      bebasTodayAgg,
      bulananTotalAgg,
      bebasTotalAgg,
      kasTxCount,
      bulananTxCount,
      bebasTxCount,
      latestBulanan,
      latestBebas,
      latestKas,
      recentKas,
      recentBulanan,
      recentBebas,
    ] = await Promise.all([
      prisma.siswa.count({ where: { statusSiswa: 'AKTIF' } }),
      prisma.kelas.count(),
      prisma.kas.aggregate({
        where: { jenis: 'masuk', tgl: todayRange },
        _sum: { pemasukan: true },
      }),
      prisma.kas.aggregate({
        where: { jenis: 'masuk' },
        _sum: { pemasukan: true },
      }),
      prisma.pembayaranBulanan.aggregate({
        where: { tglBayar: todayRange },
        _sum: { jumlahBayar: true },
      }),
      prisma.pembayaranBebas.aggregate({
        where: { tglBayar: todayRange },
        _sum: { jumlahBayar: true },
      }),
      prisma.pembayaranBulanan.aggregate({
        _sum: { jumlahBayar: true },
      }),
      prisma.pembayaranBebas.aggregate({
        _sum: { jumlahBayar: true },
      }),
      prisma.kas.count({ where: kasTxWhere }),
      prisma.pembayaranBulanan.count({ where: payTxWhere }),
      prisma.pembayaranBebas.count({ where: payTxWhere }),
      prisma.pembayaranBulanan.aggregate({ _max: { tglBayar: true } }),
      prisma.pembayaranBebas.aggregate({ _max: { tglBayar: true } }),
      prisma.kas.aggregate({ where: { jenis: 'masuk' }, _max: { tgl: true } }),
      prisma.kas.findMany({
        where: kasTxWhere,
        take: fetchWindow,
        orderBy: { tgl: 'desc' },
        include: { user: true },
      }),
      prisma.pembayaranBulanan.findMany({
        where: payTxWhere,
        take: fetchWindow,
        orderBy: { tglBayar: 'desc' },
        include: {
          user: true,
          tagihanBulanan: {
            include: { siswa: true },
          },
        },
      }),
      prisma.pembayaranBebas.findMany({
        where: payTxWhere,
        take: fetchWindow,
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

    const totalTransactions = kasTxCount + bulananTxCount + bebasTxCount;
    const totalPages = Math.max(1, Math.ceil(totalTransactions / limit));
    const safePage = Math.min(page, totalPages);
    const startIdx = (safePage - 1) * limit;

    const mergedTransactions = [
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
      .slice(startIdx, startIdx + limit);

    const latestDates = [
      latestBulanan._max.tglBayar,
      latestBebas._max.tglBayar,
      latestKas._max.tgl,
    ].filter((d): d is Date => Boolean(d));
    const latestTransactionDate =
      latestDates.length > 0
        ? new Date(Math.max(...latestDates.map((d) => d.getTime()))).toISOString()
        : null;

    return NextResponse.json({
      totalSiswa,
      totalKelas,
      todayIncome,
      totalPaymentIncome,
      totalKasIncome,
      netBalance: totalPaymentIncome + totalKasIncome,
      latestTransactionDate,
      pagination: {
        page: safePage,
        limit,
        totalTransactions,
        totalPages,
      },
      recentTransactions: mergedTransactions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
