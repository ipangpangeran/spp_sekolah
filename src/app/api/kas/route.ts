import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookies, isAdminSession } from '@/lib/session';
import { withApiLogging } from '@/lib/api-logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    if (startDate && endDate) {
      where.tgl = {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59'),
      };
    }

    const kasList = await prisma.kas.findMany({
      where,
      include: { user: true, posBayar: true },
      orderBy: { tgl: 'desc' },
    });

    const totalPemasukan = kasList.reduce((sum, k) => sum + k.pemasukan, 0);
    const totalPengeluaran = kasList.reduce((sum, k) => sum + k.pengeluaran, 0);
    const saldoKas = totalPemasukan - totalPengeluaran;

    return NextResponse.json({ kasList, totalPemasukan, totalPengeluaran, saldoKas });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handlePost(request: Request) {
  try {
    const body = await request.json();
    // Support multi-row or single row entry
    const items: Array<{ uraian: string; pengeluaran?: number; pemasukan?: number; jenis: 'masuk' | 'keluar'; idPosBayar?: number }> = Array.isArray(body.items) ? body.items : [body];
    const { idUser } = body;

    let userId = idUser;
    if (!userId) {
      const session = getSessionFromCookies();
      if (session?.id) {
        userId = session.id;
      } else {
        const defaultUser = await prisma.user.findFirst({ where: { level: 'bendahara' } });
        userId = defaultUser?.id || 1;
      }
    }

    const createdEntries = [];
    for (const item of items) {
      if (!item.uraian) continue;
      const entry = await prisma.kas.create({
        data: {
          tgl: new Date(),
          uraian: item.uraian,
          pemasukan: item.pemasukan || 0,
          pengeluaran: item.pengeluaran || 0,
          jenis: item.jenis || 'keluar',
          idUser: userId,
          idPosBayar: item.idPosBayar || null,
        },
      });
      createdEntries.push(entry);
    }

    return NextResponse.json({ success: true, createdEntries });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handlePut(request: Request) {
  try {
    if (!isAdminSession()) {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Administrator yang dapat mengubah data kas.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const id = parseInt(body.id, 10);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID kas tidak valid' }, { status: 400 });
    }

    const uraian = String(body.uraian || '').trim();
    if (!uraian) {
      return NextResponse.json({ error: 'Uraian transaksi wajib diisi' }, { status: 400 });
    }

    const pemasukan = Number(body.pemasukan ?? 0);
    const idPosBayar = body.idPosBayar ? parseInt(body.idPosBayar, 10) : null;
    const tgl = body.tgl ? new Date(body.tgl) : undefined;

    const updated = await prisma.kas.update({
      where: { id },
      data: {
        uraian,
        pemasukan: Number.isNaN(pemasukan) ? 0 : pemasukan,
        idPosBayar: idPosBayar && !Number.isNaN(idPosBayar) ? idPosBayar : null,
        ...(tgl && !Number.isNaN(tgl.getTime()) ? { tgl } : {}),
      },
      include: { user: true, posBayar: true },
    });

    return NextResponse.json({ success: true, entry: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleDelete(request: Request) {
  try {
    if (!isAdminSession()) {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Administrator yang dapat menghapus data kas.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '', 10);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID kas tidak valid' }, { status: 400 });
    }

    await prisma.kas.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = withApiLogging(handlePost, 'KAS_CREATE');
export const PUT = withApiLogging(handlePut, 'KAS_UPDATE');
export const DELETE = withApiLogging(handleDelete, 'KAS_DELETE');
