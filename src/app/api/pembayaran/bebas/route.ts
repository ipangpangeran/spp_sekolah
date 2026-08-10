import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idTagihanBebas, jumlahBayar, keterangan, idUser } = body;

    const amount = parseFloat(jumlahBayar);
    if (!idTagihanBebas || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Jumlah pembayaran tidak valid' }, { status: 400 });
    }

    const tagihan = await prisma.tagihanBebas.findUnique({
      where: { id: idTagihanBebas },
      include: {
        siswa: { include: { kelas: true } },
        jenisPembayaran: { include: { posBayar: true } },
      },
    });

    if (!tagihan) {
      return NextResponse.json({ error: 'Tagihan tidak ditemukan' }, { status: 404 });
    }

    let userId = idUser;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst({ where: { level: 'bendahara' } });
      userId = defaultUser?.id || 1;
    }

    const newTerbayar = tagihan.terbayar + amount;
    const isLunas = newTerbayar >= tagihan.totalTagihan;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const noRef = `GBB-${dateStr}${randomSuffix}-${tagihan.siswa.nis}`;

    // Update TagihanBebas status & terbayar
    await prisma.tagihanBebas.update({
      where: { id: idTagihanBebas },
      data: {
        terbayar: newTerbayar,
        statusBayar: isLunas ? 'LUNAS' : 'BELUM_LUNAS',
      },
    });

    // Create PembayaranBebas log
    const pembayaran = await prisma.pembayaranBebas.create({
      data: {
        idTagihanBebas,
        tglBayar: new Date(),
        jumlahBayar: amount,
        keterangan: keterangan || `Pembayaran ${tagihan.jenisPembayaran.posBayar.namaPosBayar}`,
        idUser: userId,
        noRef,
      },
    });

    // Create Kas Entry
    await prisma.kas.create({
      data: {
        tgl: new Date(),
        uraian: `Pembayaran ${tagihan.jenisPembayaran.posBayar.namaPosBayar} a.n ${tagihan.siswa.namaSiswa} (${tagihan.siswa.nis}) - ${keterangan || 'Cicilan'}`,
        pemasukan: amount,
        pengeluaran: 0,
        jenis: 'masuk',
        idUser: userId,
        idPosBayar: tagihan.jenisPembayaran.idPosBayar,
      },
    });

    return NextResponse.json({
      success: true,
      pembayaran,
      noRef,
      terbayar: newTerbayar,
      remaining: Math.max(0, tagihan.totalTagihan - newTerbayar),
      isLunas,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
