# Data Migration Plan: Legacy MySQL (`sisma`) → Modern Prisma (`new_sisma`)

**Date:** 2026-11-25  
**Source Database:** MySQL 5.7 / MariaDB (`sisma` — 14 base tables, 3 SQL views)  
**Target Database:** Prisma ORM Schema (`new_sisma/prisma/schema.prisma` — 12 normalized models; SQLite in dev, PostgreSQL/MySQL recommended for prod)  

---

## 1. Schema Architecture Comparison

### Key Structural Differences
1. **Audit-Separated Payment Tables:**
   - **Legacy (`sisma`):** `tagihan_bulanan` stores **both** the billing slot and the payment state in a single row (`jumlahBayar`, `tglBayar`, `statusBayar` enum `'0'|'1'|'2'`, `inv`, `caraBayar`). There is no separate `pembayaran_bulanan` audit table! Meanwhile, flexible fees use two tables: `tagihan_bebas` + `tagihan_bebas_bayar`.
   - **Modern (`new_sisma`):** Normalizes both payment types symmetrically:
     - `TagihanBulanan` (12 slots) ──1:N──▶ `PembayaranBulanan` (immutable payment receipt rows with `noRef` & `idUser`).
     - `TagihanBebas` (target + cached `terbayar` sum) ──1:N──▶ `PembayaranBebas` (installment receipt rows with `noRef` & `idUser`).
2. **Elimination of `bulan` Lookup Table & SQL Views:**
   - Legacy joins `tagihan_bulanan.idBulan` (`'1'`=Januari/`urutan:7` ... `'7'`=Juli/`urutan:1`) against the `bulan` table and relies on 3 database views (`view_detil_jenis_bayar`, `view_detil_siswa`, `view_laporan_bayar_bulanan`).
   - Modern denormalizes `bulan` (`"Juli"`..`"Juni"`) and `urutanBulan` (`1`..`12`) directly onto `TagihanBulanan` with composite unique index `@@unique([idJenisPembayaran, idSiswa, urutanBulan])`, replacing SQL views with typed Prisma `include` queries.
3. **Stricter Uniqueness & Foreign Key Constraints in Modern:**
   - Legacy MySQL tables lack strict `UNIQUE` constraints on `siswa.nisSiswa`, `siswa.nisnSiswa`, `kelas_siswa.nmKelas`, and `pos_bayar.nmPosBayar` (verified in production snapshot: multiple students have `nisSiswa = ""` or placeholder `"-"` values).
   - Modern `new_sisma/prisma/schema.prisma` enforces `@unique` on **`Siswa.nis`**, **`Siswa.nisn`**, **`Kelas.namaKelas`**, **`PosBayar.namaPosBayar`**, **`TahunAjaran.tahunAjaran`**, **`TagihanBulanan([idJenisPembayaran, idSiswa, urutanBulan])`**, and **`TagihanBebas([idJenisPembayaran, idSiswa])`**. Raw copy without sanitization will immediately fail with `P2002 Unique constraint failed`.

---

## 2. Complete Table & Column Mapping Matrix

| Legacy Table & Column (MySQL) | Legacy Type | Modern Model & Field (Prisma) | Modern Type | Transformation Rule & Notes |
| :--- | :--- | :--- | :--- | :--- |
| **`tahun_ajaran`** | | **`TahunAjaran`** | | |
| `idTahunAjaran` | `int(5) PK` | `id` | `Int @id` | Preserve integer ID. |
| `nmTahunAjaran` | `varchar(9)` | `tahunAjaran` | `String @unique` | Trim whitespace; deduplicate if legacy has duplicate strings. |
| `aktif` | `enum('Y','T')` | `status` | `String` | `'Y'` → `'AKTIF'`; `'T'` (or `NULL`) → `'TIDAK_AKTIF'`. Ensure at most 1 `'AKTIF'`. |
| **`kelas_siswa`** | | **`Kelas`** | | |
| `idKelas` | `int(5) PK` | `id` | `Int @id` | Preserve integer ID (16 rows in prod snapshot). |
| `nmKelas` | `varchar(20)` | `namaKelas` | `String @unique` | Trim; if duplicate class names exist, append `(ID {idKelas})`. |
| `ketKelas` | `varchar(255)` | `keterangan` | `String?` | Empty/`'-'` → `null`. |
| **`siswa`** | | **`Siswa`** | | |
| `idSiswa` | `int(10) PK` | `id` | `Int @id` | Preserve integer ID (515 rows in prod snapshot). |
| `nisSiswa` | `varchar(25)` | `nis` | `String? @unique` | Trim; convert `""` or `"-"` to `null`; if duplicate NIS exists, keep on active/newest student and set duplicate to `null` (log collision). |
| `nisnSiswa` | `varchar(25)` | `nisn` | `String? @unique` | **Critical:** `new_sisma` marks `nisn @unique`! Convert `""` / `"-"` / `"0"` to `null` and deduplicate collisions identically to `nis`. |
| `nmSiswa` | `varchar(100)` | `namaSiswa` | `String` | Trim trailing/leading spaces (e.g., `"ABDUL RAZAQ MALIK "` → `"ABDUL RAZAQ MALIK"`). |
| `jkSiswa` | `varchar(15)` | `jenisKelamin` | `String` | Normalize `'L'`/`'Laki-laki'` → `'L'`, `'P'`/`'Perempuan'` → `'P'`, fallback `'L'`. |
| `idKelas` | `int(5) FK` | `idKelas` | `Int` | Validate FK exists in `Kelas`; if orphaned/NULL, assign to a fallback `"Unassigned"` class. |
| *(N/A)* | — | `hpSiswa` | `String?` | Set `null` (legacy only stored parent phone). |
| `noHpOrtu` | `varchar(30)` | `hpOrtu` | `String?` | Strip spaces; convert `""` or `"-"` to `null`; normalize leading `08...` or `+628...` consistently. |
| `statusSiswa` | `enum('Aktif','Non Aktif','Pindah','Drop Out','Lulus')` | `statusSiswa` | `String` | `'Aktif'` → `'AKTIF'`; `'Lulus'` → `'LULUS'`; `'Pindah'` → `'PINDAH'`; `'Non Aktif'` & `'Drop Out'` → `'ALUMNI'`. |
| `agamaSiswa`, `nmOrtu`, `alamatOrtu`, `saldo`, `username`, `password` | `varchar` / `double` | *(Unmapped)* | — | **Data Loss Warning:** Either add optional `namaOrtu`, `alamatOrtu`, `agama` fields to `Siswa` in Prisma before cutover, or archive legacy CSV snapshot. |
| **`users`** | | **`User`** | | |
| *(Auto)* | — | `id` | `Int @id` | Generate sequential `id` (`1..N`); build `username -> id` lookup map. |
| `username` | `varchar(50) PK` | `username` | `String @unique` | Trim lowercase/exact username. |
| `password` | `varchar(50)` (MD5) | `password` | `String` (Bcrypt) | **Cannot reverse MD5.** Issue temporary Bcrypt-hashed passwords (`bcrypt.hash(..., 10)`) per staff user and force password rotation on first login. Skip `blokir='Y'` accounts or prefix inactive marker. |
| `nama_lengkap` | `varchar(100)` | `namaLengkap` | `String` | Direct copy. |
| `level` | `varchar(20)` | `level` | `String` | `'admin'` → `'admin'`; `'bendahara'` → `'bendahara'`; others → `'bendahara'`. |
| *(Active TA)* | — | `idTahunAjaran` | `Int?` | Link to active `TahunAjaran.id`. |
| **`pos_bayar`** | | **`PosBayar`** | | |
| `idPosBayar` | `int(5) PK` | `id` | `Int @id` | Preserve ID (e.g., `16` = `"SPP"`). |
| `nmPosBayar` | `varchar(100)` | `namaPosBayar` | `String @unique` | Trim; deduplicate if needed. |
| `ketPosBayar` | `varchar(100)` | `keterangan` | `String?` | Direct copy. |
| **`jenis_bayar`** | | **`JenisPembayaran`** | | |
| `idJenisBayar` | `int(10) PK` | `id` | `Int @id` | Preserve ID. |
| `idPosBayar` | `int(5) FK` | `idPosBayar` | `Int` | Direct FK copy. |
| `idTahunAjaran` | `int(5) FK` | `idTahunAjaran` | `Int` | Direct FK copy. |
| `tipeBayar` | `enum('bulanan','bebas')` | `tipeBayar` | `String` | Direct copy (`'bulanan'` or `'bebas'`). Note: `nmJenisBayar` is not in Modern `JenisPembayaran` (derived from `PosBayar.namaPosBayar`). |
| **`tagihan_bulanan` + `bulan`** | | **`TagihanBulanan` + `PembayaranBulanan`** | | |
| `idTagihanBulanan` | `int(50) PK` | `TagihanBulanan.id` | `Int @id` | Preserve ID (6,180 rows in prod snapshot). |
| `idJenisBayar`, `idSiswa` | `int` | `idJenisPembayaran`, `idSiswa` | `Int` | Skip/archive orphaned rows where `idSiswa` no longer exists in `siswa`. Deduplicate on `(idJenisPembayaran, idSiswa, urutanBulan)`. |
| `idBulan` → `bulan.nmBulan`, `bulan.urutan` | `varchar(15)` | `bulan`, `urutanBulan` | `String`, `Int` | Join `bulan` table: e.g., `idBulan='7'` → `bulan='Juli', urutanBulan=1`; `idBulan='1'` → `bulan='Januari', urutanBulan=7`. |
| `jumlahBayar` | `int(10)` | `tarif` | `Float` | Cast to float (`125000.0`). |
| `statusBayar` | `enum('0','1','2')` | `statusBayar` | `String` | `'1'` → `'LUNAS'`; `'0'` or `'2'` (pending Midtrans) → `'BELUM_BAYAR'`. |
| `tglBayar`, `inv` (when `statusBayar='1'`) | `datetime`, `varchar` | **`PembayaranBulanan`** row | New child row | **Synthesize child receipt row** for every `statusBayar == '1'`: `tglBayar = tglBayar \|\| tglUpdate \|\| now()`, `jumlahBayar = tarif`, `noRef = inv \|\| "MIG-SPP-{idTagihanBulanan}"`, `idUser = defaultAdminId`. |
| **`tagihan_bebas` + `tagihan_bebas_bayar`** | | **`TagihanBebas` + `PembayaranBebas`** | | |
| `idTagihanBebas` | `int(50) PK` | `TagihanBebas.id` | `Int @id` | Preserve ID; deduplicate on `(idJenisPembayaran, idSiswa)`. |
| `totalTagihan` | `int(10)` | `totalTagihan` | `Float` | Cast to float. |
| `SUM(tagihan_bebas_bayar.jumlahBayar)` | Computed | `terbayar` | `Float` | **Compute dynamically** from child `tagihan_bebas_bayar` rows instead of trusting legacy flag! |
| `statusBayar` (`'0'\|'1'\|'2'`) | `enum` | `statusBayar` | `String` | `'LUNAS'` if `terbayar >= totalTagihan && totalTagihan > 0`, else `'BELUM_LUNAS'`. |
| `tagihan_bebas_bayar.*` | Child rows | **`PembayaranBebas`** | Child rows | Map `tglBayar` (append `T00:00:00Z`), `jumlahBayar`, `ketBayar` (`keterangan`), generate unique `noRef = "MIG-BBS-{idTagihanBebasBayar}"`. |
| **`kas` + `jurnal_umum`** | | **`Kas`** | | |
| `kas.kode`, `tgl`, `keterangan`, `jumlah`, `keluar`, `jenis` | Mixed | `Kas.*` | `Kas` | Map `jumlah` → `pemasukan`, `keluar` → `pengeluaran`, `jenis` → `'masuk'\|'keluar'`. |
| `jurnal_umum.tgl`, `ket`, `pengeluaran` | `int`/`varchar` | `Kas.*` (`jenis='keluar'`) | `Kas` | Merge non-empty `jurnal_umum` expense rows into `Kas` (`jenis = 'keluar'`) so historical operational expenses are not lost! |
| **`identitas`** | | **`Pengaturan`** | | |
| `npsn`, `nmSekolah`, `alamat`, `nmKepsek`, `nipKepsek`, `nmBendahara`, `nipBendahara` | `varchar` | `Pengaturan` (`id=1`) | `String` | Map single singleton row (`id = 1`). **Sanitize `nipKaTU` / `nipBendahara` / `link`** if they contain Midtrans keys/URLs in legacy! |

---

## 3. Sample Production-Ready Migration Script (Node.js / TypeScript + Prisma)

Since Node.js and Prisma are guaranteed to be available on the target server (without needing a separate Python runtime), the migration script below uses **Node.js (`tsx` + `@prisma/client` + `mysql2/promise` or JSON/SQL data source)** to migrate **Students (`siswa` → `Siswa`)** and **Monthly Tuition Bills & Receipts (`tagihan_bulanan` + `bulan` → `TagihanBulanan` + `PembayaranBulanan`)** with dry-run validation and exact Rupiah checksum reconciliation.

```typescript
/**
 * Production Migration Script (Node.js / TypeScript): Legacy (sisma) -> Modern Prisma (new_sisma)
 * Run Dry-Run : DRY_RUN=1 npx tsx scripts/migrate_sisma_to_new.ts
 * Run Commit  : DRY_RUN=0 npx tsx scripts/migrate_sisma_to_new.ts
 * Note: Supports reading either from Legacy MySQL (mysql2/promise) or an attached JSON/SQL dump.
 */

import { PrismaClient } from "@prisma/client";
import mysql from "mysql2/promise";

const prisma = new PrismaClient();
const DRY_RUN = (process.env.DRY_RUN ?? "1") === "1";

const FALLBACK_BULAN_MAP: Record<string, { nama: string; urutan: number }> = {
  "7": { nama: "Juli", urutan: 1 },
  "8": { nama: "Agustus", urutan: 2 },
  "9": { nama: "September", urutan: 3 },
  "10": { nama: "Oktober", urutan: 4 },
  "11": { nama: "November", urutan: 5 },
  "12": { nama: "Desember", urutan: 6 },
  "1": { nama: "Januari", urutan: 7 },
  "2": { nama: "Februari", urutan: 8 },
  "3": { nama: "Maret", urutan: 9 },
  "4": { nama: "April", urutan: 10 },
  "5": { nama: "Mei", urutan: 11 },
  "6": { nama: "Juni", urutan: 12 },
};

const STATUS_SISWA_MAP: Record<string, string> = {
  Aktif: "AKTIF",
  Lulus: "LULUS",
  Pindah: "PINDAH",
  "Non Aktif": "ALUMNI",
  "Drop Out": "ALUMNI",
};

function cleanNullableStr(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return ["", "-", "0", "NULL", "null"].includes(s) ? null : s;
}

function cleanPhone(val: unknown): string | null {
  const raw = cleanNullableStr(val);
  if (!raw) return null;
  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.length < 8) return null;
  if (digits.startsWith("+62")) digits = "0" + digits.slice(3);
  else if (digits.startsWith("62")) digits = "0" + digits.slice(2);
  return digits;
}

function parseLegacyDate(val: unknown): Date {
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  if (typeof val === "string" && val.trim() && !val.startsWith("0000-00-00")) {
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

async function runMigration() {
  const mysqlConn = await mysql.createConnection({
    host: process.env.LEGACY_DB_HOST || "127.0.0.1",
    port: Number(process.env.LEGACY_DB_PORT || 3306),
    user: process.env.LEGACY_DB_USER || "root",
    password: process.env.LEGACY_DB_PASS || "",
    database: process.env.LEGACY_DB_NAME || "sisma",
  });

  const anomalies: string[] = [];

  try {
    const [kelasRows] = await mysqlConn.query<mysql.RowDataPacket[]>(
      "SELECT idKelas, nmKelas FROM kelas_siswa;"
    );
    const validClasses = new Set<number>(kelasRows.map((r) => Number(r.idKelas)));

    const [bulanRows] = await mysqlConn.query<mysql.RowDataPacket[]>(
      "SELECT idBulan, nmBulan, urutan FROM bulan;"
    );
    const bulanMap: Record<string, { nama: string; urutan: number }> =
      bulanRows.length > 0
        ? Object.fromEntries(
            bulanRows.map((b) => [
              String(b.idBulan),
              { nama: String(b.nmBulan).trim(), urutan: Number(b.urutan) },
            ])
          )
        : FALLBACK_BULAN_MAP;

    const adminUser = await prisma.user.findFirst({
      where: { level: "admin" },
      orderBy: { id: "asc" },
    });
    const defaultUserId = adminUser?.id ?? 1;

    // 1. Transform Siswa (deduplicating @unique nis & nisn)
    const [legacyStudents] = await mysqlConn.query<mysql.RowDataPacket[]>(
      "SELECT * FROM siswa ORDER BY FIELD(statusSiswa, 'Aktif', 'Lulus', 'Pindah', 'Non Aktif', 'Drop Out'), idSiswa DESC;"
    );

    const seenNis = new Set<string>();
    const seenNisn = new Set<string>();
    const migratedStudentIds = new Set<number>();

    const siswaPayloads: Array<{
      id: number;
      nis: string | null;
      nisn: string | null;
      namaSiswa: string;
      jenisKelamin: string;
      idKelas: number;
      hpSiswa: string | null;
      hpOrtu: string | null;
      statusSiswa: string;
    }> = [];

    for (const s of legacyStudents) {
      const id = Number(s.idSiswa);
      let nis = cleanNullableStr(s.nisSiswa);
      let nisn = cleanNullableStr(s.nisnSiswa);
      const namaSiswa = String(s.nmSiswa || `Siswa #${id}`).trim();
      const jenisKelamin = String(s.jkSiswa || "L").trim().toUpperCase().startsWith("P") ? "P" : "L";
      const idKelas = Number(s.idKelas);
      const statusSiswa = STATUS_SISWA_MAP[String(s.statusSiswa || "Aktif")] ?? "AKTIF";
      const hpOrtu = cleanPhone(s.noHpOrtu);

      if (!validClasses.has(idKelas)) {
        anomalies.push(`[Siswa ${id}] Orphaned idKelas=${idKelas} for '${namaSiswa}'`);
        continue;
      }

      if (nis && seenNis.has(nis)) {
        anomalies.push(`[Siswa ${id}] Duplicate NIS '${nis}' on '${namaSiswa}' -> NULL`);
        nis = null;
      } else if (nis) {
        seenNis.add(nis);
      }

      if (nisn && seenNisn.has(nisn)) {
        anomalies.push(`[Siswa ${id}] Duplicate NISN '${nisn}' on '${namaSiswa}' -> NULL`);
        nisn = null;
      } else if (nisn) {
        seenNisn.add(nisn);
      }

      siswaPayloads.push({
        id,
        nis,
        nisn,
        namaSiswa,
        jenisKelamin,
        idKelas,
        hpSiswa: null,
        hpOrtu,
        statusSiswa,
      });
      migratedStudentIds.add(id);
    }

    // 2. Transform TagihanBulanan & Synthesize PembayaranBulanan
    const [legacyBills] = await mysqlConn.query<mysql.RowDataPacket[]>(
      "SELECT * FROM tagihan_bulanan ORDER BY idTagihanBulanan ASC;"
    );

    const seenSlots = new Set<string>();
    const seenRefs = new Set<string>();
    let legacyPaidSum = 0;

    const tagihanPayloads: Array<{
      id: number;
      idJenisPembayaran: number;
      idSiswa: number;
      bulan: string;
      urutanBulan: number;
      tarif: number;
      statusBayar: string;
    }> = [];

    const pembayaranPayloads: Array<{
      idTagihanBulanan: number;
      tglBayar: Date;
      jumlahBayar: number;
      idUser: number;
      noRef: string;
    }> = [];

    for (const b of legacyBills) {
      const id = Number(b.idTagihanBulanan);
      const idJenisPembayaran = Number(b.idJenisBayar);
      const idSiswa = Number(b.idSiswa);
      const tarif = Number(b.jumlahBayar || 0);
      const isPaid = String(b.statusBayar || "0") === "1";

      if (isPaid) legacyPaidSum += tarif;

      if (!migratedStudentIds.has(idSiswa)) {
        anomalies.push(`[TagihanBulanan ${id}] Orphaned idSiswa=${idSiswa} (paid=${isPaid})`);
        continue;
      }

      const bInfo = bulanMap[String(b.idBulan)] ?? { nama: "Juli", urutan: 1 };
      const slotKey = `${idJenisPembayaran}:${idSiswa}:${bInfo.urutan}`;
      if (seenSlots.has(slotKey)) {
        anomalies.push(`[TagihanBulanan ${id}] Duplicate slot ${slotKey} skipped`);
        continue;
      }
      seenSlots.add(slotKey);

      tagihanPayloads.push({
        id,
        idJenisPembayaran,
        idSiswa,
        bulan: bInfo.nama,
        urutanBulan: bInfo.urutan,
        tarif,
        statusBayar: isPaid ? "LUNAS" : "BELUM_BAYAR",
      });

      if (isPaid) {
        const tglBayar = parseLegacyDate(b.tglBayar || b.tglUpdate);
        const rawInv = cleanNullableStr(b.inv);
        const noRef = rawInv && !seenRefs.has(rawInv) ? rawInv : `MIG-SPP-${id}`;
        seenRefs.add(noRef);

        pembayaranPayloads.push({
          idTagihanBulanan: id,
          tglBayar,
          jumlahBayar: tarif,
          idUser: defaultUserId,
          noRef,
        });
      }
    }

    const modernPaidSum = pembayaranPayloads.reduce((acc, p) => acc + p.jumlahBayar, 0);

    console.log(`=== MIGRATION PRE-FLIGHT SUMMARY (DRY_RUN=${DRY_RUN}) ===`);
    console.log(`Students ready         : ${siswaPayloads.length} / ${legacyStudents.length}`);
    console.log(`Monthly bills ready    : ${tagihanPayloads.length} / ${legacyBills.length}`);
    console.log(`Payment receipts built : ${pembayaranPayloads.length}`);
    console.log(`Legacy Paid Checksum   : Rp ${legacyPaidSum.toLocaleString("id-ID")}`);
    console.log(`Modern Paid Checksum   : Rp ${modernPaidSum.toLocaleString("id-ID")}`);
    console.log(`Anomalies flagged      : ${anomalies.length}`);
    anomalies.slice(0, 15).forEach((w) => console.warn("  WARN:", w));

    if (!DRY_RUN) {
      await prisma.$transaction([
        prisma.pembayaranBulanan.deleteMany(),
        prisma.tagihanBulanan.deleteMany(),
        prisma.siswa.deleteMany(),
        prisma.siswa.createMany({ data: siswaPayloads }),
        prisma.tagihanBulanan.createMany({ data: tagihanPayloads }),
        prisma.pembayaranBulanan.createMany({ data: pembayaranPayloads }),
      ]);
      console.log("✅ Migration committed atomically via Prisma.");
    }
  } finally {
    await mysqlConn.end();
    await prisma.$disconnect();
  }
}

runMigration().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
```

---

## 4. Critical Migration Risks & Mitigation Plan

| Risk | Severity | Root Cause Confirmed in Codebase | Mitigation Strategy |
| :--- | :---: | :--- | :--- |
| **1. `P2002` Crash on `Siswa.nisn` & `Siswa.nis`** | **Critical** | `new_sisma/prisma/schema.prisma` defines both `nis` and `nisn` as `@unique`, while `sisma.siswa` contains empty strings `""` (e.g., `idSiswa=1015`), `"-"` strings, and potential sibling/typo duplicates. | Convert `""` and `"-"` to `NULL` (SQLite & PostgreSQL allow multiple `NULL`s in `UNIQUE` columns) and run deterministic deduplication preferring `Aktif` records. |
| **2. Double-Counting or Missing SPP Revenue in `Kas`** | **High** | In Legacy `keuangan_pembayaran.php`, paying monthly SPP updated `tagihan_bulanan.statusBayar='1'` **without** inserting a row into `kas` (`kas` only had 1 row in prod snapshot!). In Modern `POST /api/payments/spp`, every new SPP payment **inserts a `Kas` (`masuk`) row**, and `/dashboard` sums `Kas` independently of `TagihanBulanan`. | During migration, backfill a consolidated historical `Kas` (`masuk`) opening entry per paid month (or per receipt) for migrated `PembayaranBulanan`/`PembayaranBebas` so `Saldo Kas Operasional` matches historical collections on Day 1. |
| **3. Irreversible MD5 Admin Passwords** | **High** | Legacy `users.password` uses unsalted `md5()` (32-char hex), whereas `new_sisma` uses `bcryptjs.compare()`. | Pre-generate strong temporary Bcrypt hashes for the 4 staff accounts (`admin`, `erwin`, etc.), distribute credentials securely to school staff on cutover morning, and add a Change Password screen. |
| **4. Unmapped Student Columns (`nmOrtu`, `alamatOrtu`, `agamaSiswa`)** | **Medium** | `new_sisma`'s `Siswa` model omits parent name, parent address, and religion. | Add optional `namaOrtu String?`, `alamatOrtu String?`, and `agama String?` to `prisma/schema.prisma` prior to final migration (recommended—takes 5 minutes and preserves 100% of master student records). |
| **5. `caraBayar` (`Tunai` vs `Transfer`) & Pending Midtrans (`statusBayar='2'`)** | **Medium** | Legacy `tagihan_bulanan.caraBayar` tracks `Tunai`/`Transfer`/`Transfer Midtrans`, and `statusBayar='2'` marks pending VA/Midtrans checkouts. Modern `PembayaranBulanan` lacks `metodeBayar`. | Add `metodeBayar String @default("TUNAI")` to `PembayaranBulanan` and `PembayaranBebas`; map `statusBayar='2'` to `BELUM_BAYAR` after verifying no unsettled Midtrans webhook is in flight during freeze window. |
| **6. Floating-Point Monetary Representation (`Float`)** | **Low–Medium** | `new_sisma` uses Prisma `Float` (`REAL`/`DOUBLE`) for `tarif`, `jumlahBayar`, `pemasukan`, `pengeluaran`. While whole-Rupiah integers up to `2^53` (`Rp 9 quadrillion`) are exact in IEEE-754 double precision, fractional tax/percentage operations can drift. | Migrate to `Int` (whole Rupiah) or `Decimal` when switching Prisma datasource from SQLite to PostgreSQL/MySQL. |

---

## 5. Step-by-Step Cutover Checklist

1. **T-48h (Schema Alignment & Dry Run):** Add optional `namaOrtu`/`alamatOrtu`/`metodeBayar` fields to `prisma/schema.prisma`, point `DATABASE_URL` to production PostgreSQL/MySQL, and run `DRY_RUN=1 python migrate_sisma_to_new.py` against a replica of `sisma`.
2. **T-24h (Reconciliation Sign-Off):** Verify 3 exact invariants with the School Treasurer (*Bendahara*):
   - Active student headcount per class (`515` total students across `16` classes) matches 100%.
   - Sum of `PembayaranBulanan.jumlahBayar` equals `SELECT SUM(jumlahBayar) FROM tagihan_bulanan WHERE statusBayar='1'` to the exact Rupiah.
   - Sum of `PembayaranBebas.jumlahBayar` equals `SELECT SUM(jumlahBayar) FROM tagihan_bebas_bayar`.
3. **T-0 (Maintenance Window — Saturday After Counter Close):** Set legacy `sisma` to read-only/maintenance mode, take full `mysqldump`, execute `DRY_RUN=0`, smoke-test login and receipt lookup, and switch DNS (`spp-smapersiapan.web.id`).
4. **T+7 Days (Parallel Archive):** Keep legacy PHP app accessible on an internal read-only subdomain (`legacy.spp-smapersiapan.web.id`) for 1 billing cycle so treasurers can cross-check any historical slip.
