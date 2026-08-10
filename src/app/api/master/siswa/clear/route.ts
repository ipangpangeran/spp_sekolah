import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, idKelas, confirmationText } = body;

    if (action === 'clear_all') {
      if (confirmationText !== 'HAPUS SEMUA DATA SISWA') {
        return NextResponse.json(
          { error: 'Teks konfirmasi salah. Harap ketik "HAPUS SEMUA DATA SISWA"' },
          { status: 400 }
        );
      }

      // Delete all financial records & students
      await prisma.pembayaranBulanan.deleteMany({});
      await prisma.tagihanBulanan.deleteMany({});
      await prisma.pembayaranBebas.deleteMany({});
      await prisma.tagihanBebas.deleteMany({});
      const deletedStudents = await prisma.siswa.deleteMany({});

      return NextResponse.json({
        success: true,
        message: `Berhasil menghapus seluruh ${deletedStudents.count} data siswa dan seluruh histori tagihan/pembayaran terkait.`,
      });
    }

    if (action === 'archive_class') {
      if (!idKelas) {
        return NextResponse.json({ error: 'Kelas wajib dipilih' }, { status: 400 });
      }

      const idKelasNum = parseInt(idKelas);
      const studentsInClass = await prisma.siswa.findMany({
        where: { idKelas: idKelasNum },
        select: { id: true },
      });

      const studentIds = studentsInClass.map((s) => s.id);

      if (studentIds.length === 0) {
        return NextResponse.json({ message: 'Tidak ada siswa pada kelas ini.' });
      }

      // Clean financial records for these class students
      await prisma.pembayaranBulanan.deleteMany({ where: { tagihanBulanan: { idSiswa: { in: studentIds } } } });
      await prisma.tagihanBulanan.deleteMany({ where: { idSiswa: { in: studentIds } } });
      await prisma.pembayaranBebas.deleteMany({ where: { tagihanBebas: { idSiswa: { in: studentIds } } } });
      await prisma.tagihanBebas.deleteMany({ where: { idSiswa: { in: studentIds } } });

      // Archive / Update status to ALUMNI/ARSIP or delete
      const updated = await prisma.siswa.updateMany({
        where: { idKelas: idKelasNum },
        data: { statusSiswa: 'LULUS' },
      });

      return NextResponse.json({
        success: true,
        message: `Berhasil mengarsip ${updated.count} siswa pada kelas tersebut dan menghapus data keuangan lama.`,
      });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenali' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
