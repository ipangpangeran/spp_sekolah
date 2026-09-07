import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'kelas'; // 'kelas' | 'tunggakan' | 'rekap'
    const idKelas = searchParams.get('idKelas');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (type === 'kelas') {
      const classId = idKelas ? parseInt(idKelas) : undefined;
      const siswaList = await prisma.siswa.findMany({
        where: {
          statusSiswa: 'AKTIF',
          ...(classId ? { idKelas: classId } : {}),
        },
        include: {
          kelas: true,
          tagihanBulanan: {
            orderBy: { urutanBulan: 'asc' },
            include: { pembayaranBulanan: true },
          },
        },
        orderBy: [{ idKelas: 'asc' }, { namaSiswa: 'asc' }],
      });

      return NextResponse.json({ siswaList });
    }

    if (type === 'tunggakan') {
      const classId = idKelas ? parseInt(idKelas) : undefined;
      const siswaTunggakan = await prisma.siswa.findMany({
        where: {
          statusSiswa: 'AKTIF',
          ...(classId ? { idKelas: classId } : {}),
          OR: [
            { tagihanBulanan: { some: { statusBayar: 'BELUM_BAYAR' } } },
            { tagihanBebas: { some: { statusBayar: 'BELUM_LUNAS' } } },
          ],
        },
        include: {
          kelas: true,
          tagihanBulanan: {
            where: { statusBayar: 'BELUM_BAYAR' },
            orderBy: { urutanBulan: 'asc' },
          },
          tagihanBebas: {
            where: { statusBayar: 'BELUM_LUNAS' },
            include: { jenisPembayaran: { include: { posBayar: true } } },
          },
        },
        orderBy: [{ idKelas: 'asc' }, { namaSiswa: 'asc' }],
      });

      const report = siswaTunggakan.map((s) => {
        const totalUnpaidSpp = s.tagihanBulanan.reduce((sum, t) => sum + t.tarif, 0);
        const totalUnpaidBebas = s.tagihanBebas.reduce((sum, t) => sum + (t.totalTagihan - t.terbayar), 0);
        return {
          id: s.id,
          nis: s.nis || '-',
          namaSiswa: s.namaSiswa,
          kelas: s.kelas?.namaKelas || '-',
          hpOrtu: s.hpOrtu,
          unpaidMonths: s.tagihanBulanan.map((t) => t.bulan),
          unpaidBebas: s.tagihanBebas.map((t) => `${t.jenisPembayaran.posBayar.namaPosBayar} (Sisa: Rp ${(t.totalTagihan - t.terbayar).toLocaleString('id-ID')})`),
          totalTunggakan: totalUnpaidSpp + totalUnpaidBebas,
        };
      });

      return NextResponse.json({ report });
    }

    if (type === 'rekap') {
      const dateFilter: any = {};
      if (startDate || endDate) {
        dateFilter.tglBayar = {};
        if (startDate) dateFilter.tglBayar.gte = new Date(startDate);
        if (endDate) dateFilter.tglBayar.lte = new Date(endDate + 'T23:59:59');
      }

      const dateFilterKas: any = {};
      if (startDate || endDate) {
        dateFilterKas.tgl = {};
        if (startDate) dateFilterKas.tgl.gte = new Date(startDate);
        if (endDate) dateFilterKas.tgl.lte = new Date(endDate + 'T23:59:59');
      }

      // Sum SPP Bulanan
      const sppSum = await prisma.pembayaranBulanan.aggregate({
        where: dateFilter,
        _sum: { jumlahBayar: true },
        _count: true,
      });

      // Sum Bebas
      const bebasSum = await prisma.pembayaranBebas.aggregate({
        where: dateFilter,
        _sum: { jumlahBayar: true },
        _count: true,
      });

      // Kas entries
      const kasEntries = await prisma.kas.findMany({
        where: dateFilterKas,
        include: { posBayar: true, user: true },
        orderBy: { tgl: 'desc' },
      });

      const totalKasPemasukan = kasEntries.filter((k) => k.jenis === 'masuk').reduce((s, k) => s + k.pemasukan, 0);
      const totalPengeluaran = kasEntries.filter((k) => k.jenis === 'keluar').reduce((s, k) => s + k.pengeluaran, 0);

      const totalSppPemasukan = sppSum._sum.jumlahBayar || 0;
      const totalBebasPemasukan = bebasSum._sum.jumlahBayar || 0;

      const totalPemasukan = totalSppPemasukan + totalBebasPemasukan + totalKasPemasukan;

      return NextResponse.json({
        kasEntries,
        totalSppPemasukan,
        totalBebasPemasukan,
        totalKasPemasukan,
        totalPemasukan,
        totalPengeluaran,
        saldoNet: totalPemasukan - totalPengeluaran,
      });
    }

    return NextResponse.json({ error: 'Tipe laporan tidak valid' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
