import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const studentDetailInclude = {
  kelas: true,
  tagihanBulanan: {
    orderBy: { urutanBulan: 'asc' as const },
    include: {
      jenisPembayaran: { include: { posBayar: true } },
      pembayaranBulanan: { include: { user: true } },
    },
  },
  tagihanBebas: {
    include: {
      jenisPembayaran: { include: { posBayar: true } },
      pembayaranBebas: {
        orderBy: { tglBayar: 'desc' as const },
        include: { user: true },
      },
    },
  },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || searchParams.get('q') || '';
    const nis = searchParams.get('nis');
    const id = searchParams.get('id');

    // 1. Single student detail lookup by ID, NIS, NISN, or Name
    if (id || nis) {
      const term = (id || nis || '').trim();
      let siswa = null;

      if (id) {
        const parsedId = parseInt(id, 10);
        if (!isNaN(parsedId)) {
          siswa = await prisma.siswa.findUnique({
            where: { id: parsedId },
            include: studentDetailInclude,
          });
        }
      } else if (term) {
        const isPureDigits = /^\d+$/.test(term);
        const numId = isPureDigits ? Number(term) : NaN;
        const canMatchId = Number.isSafeInteger(numId) && numId > 0 && numId <= 2147483647;

        siswa = await prisma.siswa.findFirst({
          where: {
            OR: [
              { nis: term },
              { nisn: term },
              ...(canMatchId ? [{ id: numId }] : []),
            ],
          },
          include: studentDetailInclude,
        });

        // Fallback: search by namaSiswa (or partial NIS/NISN)
        if (!siswa) {
          const matches = await prisma.siswa.findMany({
            where: {
              OR: [
                { namaSiswa: { contains: term } },
                { nis: { contains: term } },
                { nisn: { contains: term } },
              ],
            },
            take: 20,
            include: { kelas: true },
            orderBy: { namaSiswa: 'asc' },
          });

          if (matches.length === 1) {
            siswa = await prisma.siswa.findUnique({
              where: { id: matches[0].id },
              include: studentDetailInclude,
            });
          } else if (matches.length > 1) {
            const exactNameMatches = matches.filter(
              (m) => m.namaSiswa.trim().toLowerCase() === term.toLowerCase()
            );
            if (exactNameMatches.length === 1) {
              siswa = await prisma.siswa.findUnique({
                where: { id: exactNameMatches[0].id },
                include: studentDetailInclude,
              });
            } else {
              return NextResponse.json({ matches });
            }
          }
        }
      }

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
