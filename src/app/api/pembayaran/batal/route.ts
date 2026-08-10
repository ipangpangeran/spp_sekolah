import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idPembayaranBulanan, idPembayaranBebas, idUser } = body;

    let userId = idUser;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst({ where: { level: 'admin' } });
      userId = defaultUser?.id || 1;
    }

    if (idPembayaranBulanan) {
      const pBln = await prisma.pembayaranBulanan.findUnique({
        where: { id: idPembayaranBulanan },
        include: {
          tagihanBulanan: {
            include: {
              siswa: true,
              jenisPembayaran: { include: { posBayar: true } },
            },
          },
        },
      });

      if (!pBln) {
        return NextResponse.json({ error: 'Data pembayaran tidak ditemukan' }, { status: 404 });
      }

      // Revert tagihan to BELUM_BAYAR
      await prisma.tagihanBulanan.update({
        where: { id: pBln.idTagihanBulanan },
        data: { statusBayar: 'BELUM_BAYAR' },
      });

      // Delete PembayaranBulanan
      await prisma.pembayaranBulanan.delete({ where: { id: idPembayaranBulanan } });

      // Add Reversal Kas Entry
      await prisma.kas.create({
        data: {
          tgl: new Date(),
          uraian: `[BATAL] Pembatalan Pembayaran SPP Bulan ${pBln.tagihanBulanan.bulan} a.n ${pBln.tagihanBulanan.siswa.namaSiswa} (${pBln.tagihanBulanan.siswa.nis})`,
          pemasukan: 0,
          pengeluaran: pBln.jumlahBayar,
          jenis: 'keluar',
          idUser: userId,
          idPosBayar: pBln.tagihanBulanan.jenisPembayaran.idPosBayar,
        },
      });

      return NextResponse.json({ success: true, message: 'Pembayaran SPP berhasil dibatalkan' });
    }

    if (idPembayaranBebas) {
      const pBebas = await prisma.pembayaranBebas.findUnique({
        where: { id: idPembayaranBebas },
        include: {
          tagihanBebas: {
            include: {
              siswa: true,
              jenisPembayaran: { include: { posBayar: true } },
            },
          },
        },
      });

      if (!pBebas) {
        return NextResponse.json({ error: 'Data pembayaran tidak ditemukan' }, { status: 404 });
      }

      const newTerbayar = Math.max(0, pBebas.tagihanBebas.terbayar - pBebas.jumlahBayar);
      const isLunas = newTerbayar >= pBebas.tagihanBebas.totalTagihan;

      await prisma.tagihanBebas.update({
        where: { id: pBebas.idTagihanBebas },
        data: {
          terbayar: newTerbayar,
          statusBayar: isLunas ? 'LUNAS' : 'BELUM_LUNAS',
        },
      });

      await prisma.pembayaranBebas.delete({ where: { id: idPembayaranBebas } });

      await prisma.kas.create({
        data: {
          tgl: new Date(),
          uraian: `[BATAL] Pembatalan Pembayaran ${pBebas.tagihanBebas.jenisPembayaran.posBayar.namaPosBayar} a.n ${pBebas.tagihanBebas.siswa.namaSiswa}`,
          pemasukan: 0,
          pengeluaran: pBebas.jumlahBayar,
          jenis: 'keluar',
          idUser: userId,
          idPosBayar: pBebas.tagihanBebas.jenisPembayaran.idPosBayar,
        },
      });

      return NextResponse.json({ success: true, message: 'Pembayaran bebas berhasil dibatalkan' });
    }

    return NextResponse.json({ error: 'ID pembayaran tidak valid' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
