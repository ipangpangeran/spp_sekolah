import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '@/lib/prisma';
import { isAdminSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db');
const BACKUP_PATH = path.join(process.cwd(), 'prisma', 'dev.db.bak');
const TMP_PATH = path.join(process.cwd(), 'prisma', 'dev.db.restore.tmp');
const SQLITE_MAGIC = 'SQLite format 3\0';

/**
 * GET /api/pengaturan/backup
 * - ?info=1 : returns DB size, mtime, and live record counts
 * - default : streams a clean SQLite binary backup (.db)
 */
export async function GET(request: Request) {
  if (!isAdminSession()) {
    return NextResponse.json(
      { error: 'Akses ditolak. Hanya Administrator yang dapat mengakses backup database.' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const infoOnly = searchParams.get('info') === '1';

    if (!fs.existsSync(DB_PATH)) {
      return NextResponse.json({ error: 'File database SQLite tidak ditemukan.' }, { status: 404 });
    }

    // Flush any pending WAL frames into main dev.db before reading
    try {
      await prisma.$executeRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE);');
    } catch {
      // Ignore if journal mode is DELETE
    }

    const stats = fs.statSync(DB_PATH);

    if (infoOnly) {
      const [siswa, tagihanBulanan, pembayaranBulanan, kas, users] = await Promise.all([
        prisma.siswa.count(),
        prisma.tagihanBulanan.count(),
        prisma.pembayaranBulanan.count(),
        prisma.kas.count(),
        prisma.user.count(),
      ]);

      return NextResponse.json({
        sizeBytes: stats.size,
        updatedAt: stats.mtime.toISOString(),
        hasSafetyBackup: fs.existsSync(BACKUP_PATH),
        counts: { siswa, tagihanBulanan, pembayaranBulanan, kas, users },
      });
    }

    const dbBuffer = fs.readFileSync(DB_PATH);
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    return new NextResponse(dbBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-sqlite3',
        'Content-Disposition': `attachment; filename="SISMA_DB_Backup_${stamp}.db"`,
        'Content-Length': String(dbBuffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal membuat backup database' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pengaturan/backup
 * Restores a valid SQLite .db file atomically with automatic rollback safety snapshot.
 */
export async function POST(request: Request) {
  if (!isAdminSession()) {
    return NextResponse.json(
      { error: 'Akses ditolak. Hanya Administrator yang dapat melakukan restore database.' },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'File backup database (.db) wajib dilampirkan.' },
        { status: 400 }
      );
    }

    if (file.size < 100 || file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Ukuran file tidak valid (minimal 100 byte, maksimal 100 MB).' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verify SQLite magic header ("SQLite format 3\0")
    const header = buffer.subarray(0, 16).toString('utf8');
    if (header !== SQLITE_MAGIC) {
      return NextResponse.json(
        { error: 'Format file bukan database SQLite (.db) yang valid.' },
        { status: 400 }
      );
    }

    // Write candidate file to temp location first
    fs.writeFileSync(TMP_PATH, buffer);

    // Disconnect Prisma before swapping SQLite file
    await prisma.$disconnect();

    // Create automatic safety backup of current DB
    if (fs.existsSync(DB_PATH)) {
      fs.copyFileSync(DB_PATH, BACKUP_PATH);
    }

    // Remove any stale WAL/SHM sidecar files before swap
    for (const suffix of ['-wal', '-shm', '-journal']) {
      const sidecar = `${DB_PATH}${suffix}`;
      if (fs.existsSync(sidecar)) {
        fs.unlinkSync(sidecar);
      }
    }

    // Swap temp file into active dev.db
    fs.renameSync(TMP_PATH, DB_PATH);

    // Reconnect and verify SISMA schema tables exist
    try {
      await prisma.$connect();
      const [siswa, users, tagihanBulanan] = await Promise.all([
        prisma.siswa.count(),
        prisma.user.count(),
        prisma.tagihanBulanan.count(),
      ]);

      return NextResponse.json({
        success: true,
        message: 'Database berhasil di-restore! Snapshot cadangan sebelumnya disimpan di dev.db.bak.',
        counts: { siswa, users, tagihanBulanan },
      });
    } catch (verifyError: any) {
      // Rollback automatically if uploaded SQLite doesn't match SISMA schema
      await prisma.$disconnect();
      if (fs.existsSync(BACKUP_PATH)) {
        fs.copyFileSync(BACKUP_PATH, DB_PATH);
      }
      await prisma.$connect();

      return NextResponse.json(
        {
          error: `Restore dibatalkan & dikembalikan ke versi sebelumnya karena struktur tabel tidak cocok: ${verifyError.message}`,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    if (fs.existsSync(TMP_PATH)) {
      try {
        fs.unlinkSync(TMP_PATH);
      } catch {
        // ignore cleanup error
      }
    }
    return NextResponse.json(
      { error: error.message || 'Gagal melakukan restore database' },
      { status: 500 }
    );
  }
}
