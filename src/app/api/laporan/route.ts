import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'kelas'; // 'kelas' | 'tunggakan' | 'rekap' | 'buku_kas'
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
      const siswaTunggakan = await prisma.siswa.findMany({
        where: {
          statusSiswa: 'AKTIF',
          ...(idKelas ? { idKelas: parseInt(idKelas) } : {}),
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
          nis: s.nis,
          namaSiswa: s.namaSiswa,
          kelas: s.kelas.namaKelas,
          hpOrtu: s.hpOrtu,
          unpaidMonths: s.tagihanBulanan.map((t) => t.bulan),
          unpaidBebas: s.tagihanBebas.map((t) => `${t.jenisPembayaran.posBayar.namaPosBayar} (Sisa: Rp ${(t.totalTagihan - t.terbayar).toLocaleString('id-ID')})`),
          totalTunggakan: totalUnpaidSpp + totalUnpaidBebas,
        };
      });

      return NextResponse.json({ report });
    }

    if (type === 'rekap') {
      const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = endDate ? new Date(endDate + 'T23:59:59') : new Date();

      const kasEntries = await prisma.kas.findMany({
        where: {
          tgl: { gte: start, lte: end },
        },
        include: { posBayar: true, user: true },
        orderBy: { tgl: 'desc' },
      });

      const totalPemasukan = kasEntries.filter((k) => k.jenis === 'masuk').reduce((s, k) => s + k.pemasukan, 0);
      const totalPengeluaran = kasEntries.filter((k) => k.jenis === 'keluar').reduce((s, k) => s + k.pengeluaran, 0);

      return NextResponse.json({
        kasEntries,
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
