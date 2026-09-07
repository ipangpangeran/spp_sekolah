import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || searchParams.get('q') || '';
    const nis = searchParams.get('nis');
    const id = searchParams.get('id');

    // 1. Single student detail lookup by ID or NIS or NISN
    if (id || nis) {
      let whereCondition: any = {};
      if (id) {
        whereCondition = { id: parseInt(id) };
      } else if (nis) {
        const numId = parseInt(nis);
        whereCondition = {
          OR: [
            { nis: nis },
            { nisn: nis },
            ...(isNaN(numId) ? [] : [{ id: numId }]),
          ],
        };
      }

      const siswa = await prisma.siswa.findFirst({
        where: whereCondition,
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

    // 2. Live search dropdown suggestions by Name, NIS, NISN
    if (!query || !query.trim()) {
      return NextResponse.json({ students: [] });
    }

    const cleanQuery = query.trim();
    const students = await prisma.siswa.findMany({
      where: {
        OR: [
          { nis: { contains: cleanQuery } },
          { nisn: { contains: cleanQuery } },
          { namaSiswa: { contains: cleanQuery } },
        ],
      },
      take: 15,
      include: { kelas: true },
      orderBy: { namaSiswa: 'asc' },
    });

    return NextResponse.json({ students });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
