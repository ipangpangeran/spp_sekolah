import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeInput } from '@/lib/security';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rows } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Data Excel kosong atau format tidak valid.' }, { status: 400 });
    }

    let successCount = 0;
    let updateCount = 0;

    for (const row of rows) {
      const namaKelas = sanitizeInput(row['Nama Kelas'] || row['namaKelas'] || row['KELAS']);
      const keterangan = sanitizeInput(row['Keterangan'] || row['keterangan'] || '');

      if (!namaKelas) continue;

      const existing = await prisma.kelas.findFirst({
        where: { namaKelas },
      });

      if (existing) {
        await prisma.kelas.update({
          where: { id: existing.id },
          data: { keterangan: keterangan || existing.keterangan },
        });
        updateCount++;
      } else {
        await prisma.kelas.create({
          data: {
            namaKelas,
            keterangan,
          },
        });
        successCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor data kelas: ${successCount} kelas baru ditambahkan, ${updateCount} kelas diperbarui.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal mengimpor data kelas.' }, { status: 500 });
  }
}
