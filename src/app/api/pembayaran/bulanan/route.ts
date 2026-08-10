import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ids, idUser } = body; // array of tagihanBulanan ids or single id

    const tagihanIds: number[] = Array.isArray(ids) ? ids : [body.idTagihanBulanan];

    if (!tagihanIds.length || !tagihanIds[0]) {
      return NextResponse.json({ error: 'Tagihan bulanan tidak valid' }, { status: 400 });
    }

    // Find default user if idUser not supplied
    let userId = idUser;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst({ where: { level: 'bendahara' } });
      userId = defaultUser?.id || 1;
    }

    const processedPayments = [];

    for (const tagihanId of tagihanIds) {
      const tagihan = await prisma.tagihanBulanan.findUnique({
        where: { id: tagihanId },
        include: {
          siswa: { include: { kelas: true } },
          jenisPembayaran: { include: { posBayar: true } },
        },
      });

      if (!tagihan) continue;

      if (tagihan.statusBayar === 'LUNAS') {
        continue;
      }

      // Generate Ref Number
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const noRef = `SYR-${dateStr}${randomSuffix}-${tagihan.siswa.nis}`;

      // Mark tagihan as LUNAS
      await prisma.tagihanBulanan.update({
        where: { id: tagihanId },
        data: { statusBayar: 'LUNAS' },
      });

      // Create PembayaranBulanan
      const pembayaran = await prisma.pembayaranBulanan.create({
        data: {
          idTagihanBulanan: tagihanId,
          tglBayar: new Date(),
          jumlahBayar: tagihan.tarif,
          idUser: userId,
          noRef,
        },
      });

      // Create Kas Entry
      await prisma.kas.create({
        data: {
          tgl: new Date(),
          uraian: `Pembayaran ${tagihan.jenisPembayaran.posBayar.namaPosBayar} Bulan ${tagihan.bulan} a.n ${tagihan.siswa.namaSiswa} (${tagihan.siswa.nis})`,
          pemasukan: tagihan.tarif,
          pengeluaran: 0,
          jenis: 'masuk',
          idUser: userId,
          idPosBayar: tagihan.jenisPembayaran.idPosBayar,
        },
      });

      processedPayments.push({
        pembayaran,
        noRef,
        bulan: tagihan.bulan,
        tarif: tagihan.tarif,
        siswa: tagihan.siswa,
        posBayar: tagihan.jenisPembayaran.posBayar.namaPosBayar,
      });
    }

    return NextResponse.json({ success: true, processedPayments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
