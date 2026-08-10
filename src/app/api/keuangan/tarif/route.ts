import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idJenisPembayaran, idKelas, tarif, totalTagihan, idSiswaList } = body;

    if (!idJenisPembayaran || (!idKelas && (!idSiswaList || !idSiswaList.length))) {
      return NextResponse.json({ error: 'Jenis Pembayaran dan Target Kelas/Siswa wajib diisi' }, { status: 400 });
    }

    const jenis = await prisma.jenisPembayaran.findUnique({
      where: { id: parseInt(idJenisPembayaran) },
    });

    if (!jenis) {
      return NextResponse.json({ error: 'Jenis Pembayaran tidak ditemukan' }, { status: 404 });
    }

    // Get list of target students
    let targetStudents: any[] = [];
    if (idSiswaList && idSiswaList.length > 0) {
      targetStudents = await prisma.siswa.findMany({
        where: { id: { in: idSiswaList.map((id: any) => parseInt(id)) }, statusSiswa: 'AKTIF' },
      });
    } else if (idKelas) {
      targetStudents = await prisma.siswa.findMany({
        where: { idKelas: parseInt(idKelas), statusSiswa: 'AKTIF' },
      });
    }

    const bulanList = [
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'
    ];

    let createdCount = 0;

    for (const student of targetStudents) {
      if (jenis.tipeBayar === 'bulanan') {
        const rate = parseFloat(tarif) || 125000;
        let idx = 1;
        for (const b of bulanList) {
          // Check if already exists
          const existing = await prisma.tagihanBulanan.findFirst({
            where: {
              idJenisPembayaran: jenis.id,
              idSiswa: student.id,
              bulan: b,
            },
          });

          if (!existing) {
            await prisma.tagihanBulanan.create({
              data: {
                idJenisPembayaran: jenis.id,
                idSiswa: student.id,
                bulan: b,
                urutanBulan: idx,
                tarif: rate,
                statusBayar: 'BELUM_BAYAR',
              },
            });
            createdCount++;
          } else if (existing.statusBayar === 'BELUM_BAYAR') {
            await prisma.tagihanBulanan.update({
              where: { id: existing.id },
              data: { tarif: rate },
            });
          }
          idx++;
        }
      } else {
        // Bebas / Flexible non-recurring
        const total = parseFloat(totalTagihan) || parseFloat(tarif) || 1500000;
        const existing = await prisma.tagihanBebas.findFirst({
          where: {
            idJenisPembayaran: jenis.id,
            idSiswa: student.id,
          },
        });

        if (!existing) {
          await prisma.tagihanBebas.create({
            data: {
              idJenisPembayaran: jenis.id,
              idSiswa: student.id,
              totalTagihan: total,
              terbayar: 0,
              statusBayar: 'BELUM_LUNAS',
            },
          });
          createdCount++;
        } else if (existing.statusBayar === 'BELUM_LUNAS') {
          await prisma.tagihanBebas.update({
            where: { id: existing.id },
            data: { totalTagihan: total },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil memproses tarif untuk ${targetStudents.length} siswa.`,
      createdCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
