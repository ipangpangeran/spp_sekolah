import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { students } = body; // Array of { nis, nisn, namaSiswa, namaKelas, jenisKelamin, hpOrtu }

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'Data siswa dari Excel kosong atau tidak valid' }, { status: 400 });
    }

    const activeTa = await prisma.tahunAjaran.findFirst({ where: { status: 'AKTIF' } });

    let successCount = 0;
    let skipCount = 0;

    for (const s of students) {
      if (!s.nis || !s.namaSiswa) {
        skipCount++;
        continue;
      }

      // 1. Find or create class
      const className = (s.namaKelas || s.kelas || 'X IPA 1').toString().trim();
      let kelasObj = await prisma.kelas.findFirst({
        where: { namaKelas: className },
      });

      if (!kelasObj) {
        kelasObj = await prisma.kelas.create({
          data: { namaKelas: className, keterangan: 'Kelas dari Impor Excel' },
        });
      }

      // 2. Check if student NIS exists
      const nisStr = s.nis.toString().trim();
      const existing = await prisma.siswa.findUnique({ where: { nis: nisStr } });

      const gender = (s.jenisKelamin || s.gender || 'L').toString().toUpperCase().startsWith('P') ? 'P' : 'L';
      const hpOrtuStr = s.hpOrtu ? s.hpOrtu.toString().trim() : null;
      const nisnStr = s.nisn ? s.nisn.toString().trim() : null;

      let studentObj;
      if (existing) {
        studentObj = await prisma.siswa.update({
          where: { id: existing.id },
          data: {
            nisn: nisnStr || existing.nisn,
            namaSiswa: s.namaSiswa.toString().trim(),
            jenisKelamin: gender,
            idKelas: kelasObj.id,
            hpOrtu: hpOrtuStr || existing.hpOrtu,
          },
        });
      } else {
        studentObj = await prisma.siswa.create({
          data: {
            nis: nisStr,
            nisn: nisnStr,
            namaSiswa: s.namaSiswa.toString().trim(),
            jenisKelamin: gender,
            idKelas: kelasObj.id,
            hpOrtu: hpOrtuStr,
            statusSiswa: 'AKTIF',
          },
        });

        // Generate 12-month SPP matrix
        if (activeTa) {
          const jenisSpp = await prisma.jenisPembayaran.findFirst({
            where: { idTahunAjaran: activeTa.id, tipeBayar: 'bulanan' },
          });

          if (jenisSpp) {
            const bulanList = [
              'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
              'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'
            ];
            let idx = 1;
            for (const b of bulanList) {
              await prisma.tagihanBulanan.create({
                data: {
                  idJenisPembayaran: jenisSpp.id,
                  idSiswa: studentObj.id,
                  bulan: b,
                  urutanBulan: idx++,
                  tarif: 125000,
                  statusBayar: 'BELUM_BAYAR',
                },
              });
            }
          }
        }
      }

      successCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${successCount} siswa (Dilewati: ${skipCount}).`,
      successCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
