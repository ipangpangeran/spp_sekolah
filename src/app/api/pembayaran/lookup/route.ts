import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const nis = searchParams.get('nis');

    if (nis) {
      const siswa = await prisma.siswa.findUnique({
        where: { nis },
        include: {
          kelas: true,
          tagihanBulanan: {
            orderBy: { urutanBulan: 'asc' },
            include: {
              jenisPembayaran: { include: { posBayar: true } },
              pembayaranBulanan: { include: { user: true } },
            },
          },
          tagihanBebas: {
            include: {
              jenisPembayaran: { include: { posBayar: true } },
              pembayaranBebas: {
                orderBy: { tglBayar: 'desc' },
                include: { user: true },
              },
            },
          },
        },
      });

      if (!siswa) {
        return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 });
      }

      return NextResponse.json({ siswa });
    }

    if (!query) {
      return NextResponse.json({ students: [] });
    }

    const students = await prisma.siswa.findMany({
      where: {
        OR: [
          { nis: { contains: query } },
          { nisn: { contains: query } },
          { namaSiswa: { contains: query } },
        ],
      },
      take: 10,
      include: { kelas: true },
    });

    return NextResponse.json({ students });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
