import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idKelas = searchParams.get('idKelas');
    const statusSiswa = searchParams.get('statusSiswa');
    const search = searchParams.get('search');

    const where: any = {};
    if (idKelas) where.idKelas = parseInt(idKelas);
    if (statusSiswa) where.statusSiswa = statusSiswa;
    if (search) {
      where.OR = [
        { nis: { contains: search } },
        { nisn: { contains: search } },
        { namaSiswa: { contains: search } },
      ];
    }

    const siswaList = await prisma.siswa.findMany({
      where,
      include: { kelas: true },
      orderBy: { namaSiswa: 'asc' },
    });

    return NextResponse.json({ siswaList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nis, nisn, namaSiswa, jenisKelamin, idKelas, hpSiswa, hpOrtu, statusSiswa } = body;

    if (!namaSiswa || !idKelas) {
      return NextResponse.json({ error: 'Nama Siswa dan Kelas wajib diisi' }, { status: 400 });
    }

    if (nis) {
      const existing = await prisma.siswa.findUnique({ where: { nis } });
      if (existing) {
        return NextResponse.json({ error: `Siswa dengan NIS ${nis} sudah ada` }, { status: 400 });
      }
    }

    const siswa = await prisma.siswa.create({
      data: {
        nis: nis || null,
        nisn: nisn || null,
        namaSiswa,
        jenisKelamin: jenisKelamin || 'L',
        idKelas: parseInt(idKelas),
        hpSiswa: hpSiswa || null,
        hpOrtu: hpOrtu || null,
        statusSiswa: statusSiswa || 'AKTIF',
      },
      include: { kelas: true },
    });

    // Automatically generate SPP 12 month bills if active jenisPembayaran exists
    const activeTa = await prisma.tahunAjaran.findFirst({ where: { status: 'AKTIF' } });
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
              idSiswa: siswa.id,
              bulan: b,
              urutanBulan: idx++,
              tarif: 125000,
              statusBayar: 'BELUM_BAYAR',
            },
          });
        }
      }
    }

    return NextResponse.json({ siswa });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, nis, nisn, namaSiswa, jenisKelamin, idKelas, hpSiswa, hpOrtu, statusSiswa } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID Siswa wajib diisi' }, { status: 400 });
    }

    const siswa = await prisma.siswa.update({
      where: { id: parseInt(id) },
      data: {
        nis: nis || null,
        nisn: nisn || null,
        namaSiswa,
        jenisKelamin,
        idKelas: parseInt(idKelas),
        hpSiswa: hpSiswa || null,
        hpOrtu: hpOrtu || null,
        statusSiswa,
      },
      include: { kelas: true },
    });

    return NextResponse.json({ siswa });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID Siswa wajib diisi' }, { status: 400 });
    }

    await prisma.siswa.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
