#!/usr/bin/env node
/**
 * Read-only MySQL (legacy `sisma`) -> Prisma SQLite (`sisma_new`) migration script.
 *
 * Safety guarantees:
 * - Only executes SELECT queries against MySQL (never writes/modifies legacy DB).
 * - Creates a timestamped backup of `prisma/dev.db` before modifying SQLite.
 * - Preserves existing `Pengaturan` and `User` credentials in `sisma_new`.
 * - Sanitizes empty/duplicate `nis` and `nisn` to satisfy Prisma `@unique` constraints.
 *
 * Usage:
 *   node scripts/migrate-from-mysql.mjs --php-config=/var/www/sisma/config/koneksi.php
 *   MYSQL_HOST=127.0.0.1 MYSQL_USER=... MYSQL_PASSWORD=... MYSQL_DATABASE=sisma node scripts/migrate-from-mysql.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const args = {};
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--")) {
      const [k, v] = arg.slice(2).split("=");
      args[k] = v ?? true;
    }
  }
  return args;
}

function loadPhpConfig(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`PHP config file not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, "utf8");
  const extract = (varName) => {
    const re = new RegExp(`\\$${varName}\\s*=\\s*["']([^"']*)["']\\s*;`);
    const m = content.match(re);
    return m ? m[1] : undefined;
  };
  return {
    host: extract("server") || "127.0.0.1",
    user: extract("username"),
    password: extract("password") ?? "",
    database: extract("database"),
  };
}

function getMysqlConfig(args) {
  if (args["php-config"]) {
    const phpCfg = loadPhpConfig(String(args["php-config"]));
    return {
      host: process.env.MYSQL_HOST || (phpCfg.host === "localhost" ? "127.0.0.1" : phpCfg.host),
      user: process.env.MYSQL_USER || phpCfg.user,
      password: process.env.MYSQL_PASSWORD ?? phpCfg.password,
      database: process.env.MYSQL_DATABASE || phpCfg.database,
    };
  }
  return {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    user: process.env.MYSQL_USER || "sisma",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "sisma",
  };
}

function cleanStr(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s === "" || s === "-" ? null : s;
}

function cleanNisn(val) {
  const s = cleanStr(val);
  if (!s || s === "0") return null;
  return s;
}

function parseDateSafe(val, fallback = new Date()) {
  if (!val) return fallback;
  if (val instanceof Date && !Number.isNaN(val.getTime())) return val;
  const s = String(val).trim();
  if (!s || s.startsWith("0000-00-00")) return fallback;
  const d = new Date(s.includes("T") ? s : s.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? fallback : d;
}

function mapStatusSiswa(raw) {
  const map = {
    Aktif: "AKTIF",
    "Non Aktif": "ALUMNI",
    Pindah: "PINDAH",
    "Drop Out": "ALUMNI",
    Lulus: "LULUS",
  };
  return map[String(raw || "").trim()] || "AKTIF";
}

function backupSqliteDb() {
  const dbPath = path.join(ROOT_DIR, "prisma", "dev.db");
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Target SQLite DB not found: ${dbPath}`);
  }
  const backupDir = path.join(ROOT_DIR, "prisma", "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const bakPath = path.join(backupDir, `dev.db.pre_migrate_${ts}.bak`);
  fs.copyFileSync(dbPath, bakPath);
  console.log(`✅ Backup SQLite dibuat: ${bakPath}`);
}

async function main() {
  const args = parseArgs(process.argv);
  const cfg = getMysqlConfig(args);
  if (!cfg.user || !cfg.database) {
    throw new Error("MySQL user/database tidak lengkap. Gunakan --php-config atau env MYSQL_*");
  }

  backupSqliteDb();

  console.log(`🔌 Menghubungkan ke MySQL (read-only): ${cfg.user}@${cfg.host}/${cfg.database}`);
  const mysqlConn = await mysql.createConnection({
    host: cfg.host,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    charset: "utf8mb4",
  });

  const prisma = new PrismaClient();

  try {
    // 1. Read all legacy tables (SELECT only)
    const [identitasRows] = await mysqlConn.query("SELECT * FROM identitas LIMIT 1");
    const [taRows] = await mysqlConn.query("SELECT * FROM tahun_ajaran ORDER BY idTahunAjaran ASC");
    const [kelasRows] = await mysqlConn.query("SELECT * FROM kelas_siswa ORDER BY idKelas ASC");
    const [siswaRows] = await mysqlConn.query("SELECT * FROM siswa ORDER BY idSiswa ASC");
    const [userRows] = await mysqlConn.query("SELECT * FROM users");
    const [posRows] = await mysqlConn.query("SELECT * FROM pos_bayar ORDER BY idPosBayar ASC");
    const [jenisRows] = await mysqlConn.query("SELECT * FROM jenis_bayar ORDER BY idJenisBayar ASC");
    const [bulanRows] = await mysqlConn.query("SELECT * FROM bulan ORDER BY urutan ASC");
    const [tagihanBulananRows] = await mysqlConn.query("SELECT * FROM tagihan_bulanan ORDER BY idTagihanBulanan ASC");
    const [tagihanBebasRows] = await mysqlConn.query("SELECT * FROM tagihan_bebas ORDER BY idTagihanBebas ASC");
    const [tagihanBebasBayarRows] = await mysqlConn.query("SELECT * FROM tagihan_bebas_bayar ORDER BY idTagihanBebasBayar ASC");
    const [kasRows] = await mysqlConn.query("SELECT * FROM kas ORDER BY kode ASC");
    const [jurnalRows] = await mysqlConn.query("SELECT * FROM jurnal_umum ORDER BY id ASC").catch(() => [[]]);

    // Preserve existing Pengaturan & Users in sisma_new
    const existingPengaturan = await prisma.pengaturan.findFirst();
    const existingUsers = await prisma.user.findMany({ orderBy: { id: "asc" } });
    const existingUserMap = new Map(existingUsers.map((u) => [u.username.trim().toLowerCase(), u]));

    // Clear target tables in safe dependency order inside a transaction
    console.log("🧹 Membersihkan tabel transaksi & master di SQLite target...");
    await prisma.$transaction([
      prisma.pembayaranBulanan.deleteMany(),
      prisma.tagihanBulanan.deleteMany(),
      prisma.pembayaranBebas.deleteMany(),
      prisma.tagihanBebas.deleteMany(),
      prisma.kas.deleteMany(),
      prisma.jenisPembayaran.deleteMany(),
      prisma.posBayar.deleteMany(),
      prisma.siswa.deleteMany(),
      prisma.kelas.deleteMany(),
      prisma.user.deleteMany(),
      prisma.tahunAjaran.deleteMany(),
    ]);

    // 2. Pengaturan (preserve existing if present, otherwise seed from identitas)
    if (!existingPengaturan && identitasRows.length > 0) {
      const idn = identitasRows[0];
      await prisma.pengaturan.create({
        data: {
          id: 1,
          namaSekolah: cleanStr(idn.nmSekolah) || "SMA Swasta Persiapan Stabat",
          npsn: cleanStr(idn.npsn) || "10201322",
          alamat: cleanStr(idn.alamat) || "Jl. HIB Tembeleng, Stabat",
          telepon: "(061) 8912345",
          email: "info@smapersiapan-stabat.sch.id",
          website: cleanStr(idn.link) || "https://spp-smapersiapan.web.id",
          kepalaSekolah: cleanStr(idn.nmKepsek) || "IRWAN AMRI, S.P",
          nipKepalaSekolah: cleanStr(idn.nipKepsek) || "",
          bendahara: cleanStr(idn.nmBendahara) || "FAIRUZA RIKHA AMRI, S.E, M.Si",
          nipBendahara: cleanStr(idn.nipBendahara) || "",
          logo: "/logo_sisma.png",
        },
      });
    }

    // 3. TahunAjaran
    const seenTa = new Set();
    let activeTaId = 1;
    let hasActiveTa = false;
    const taData = [];
    for (const r of taRows) {
      let taName = cleanStr(r.nmTahunAjaran) || `TA-${r.idTahunAjaran}`;
      if (seenTa.has(taName)) taName = `${taName} (${r.idTahunAjaran})`;
      seenTa.add(taName);
      const isActive = r.aktif === "Y" && !hasActiveTa;
      if (isActive) {
        hasActiveTa = true;
        activeTaId = r.idTahunAjaran;
      }
      taData.push({
        id: r.idTahunAjaran,
        tahunAjaran: taName,
        status: isActive ? "AKTIF" : "TIDAK_AKTIF",
      });
    }
    if (taData.length > 0) {
      if (!hasActiveTa) {
        taData[0].status = "AKTIF";
        activeTaId = taData[0].id;
      }
      await prisma.tahunAjaran.createMany({ data: taData });
    }
    console.log(`✅ TahunAjaran: ${taData.length}`);

    // 4. Kelas
    const validKelasIds = new Set();
    const seenKelasNames = new Set();
    const kelasData = [];
    for (const r of kelasRows) {
      let namaKelas = cleanStr(r.nmKelas) || `Kelas-${r.idKelas}`;
      if (seenKelasNames.has(namaKelas)) namaKelas = `${namaKelas} (${r.idKelas})`;
      seenKelasNames.add(namaKelas);
      validKelasIds.add(r.idKelas);
      kelasData.push({
        id: r.idKelas,
        namaKelas,
        keterangan: cleanStr(r.ketKelas),
      });
    }
    if (kelasData.length > 0) {
      await prisma.kelas.createMany({ data: kelasData });
    }
    console.log(`✅ Kelas: ${kelasData.length}`);

    // 5. Users (preserve existing sisma_new users + add any missing MySQL active users)
    const usersToInsert = [];
    let maxUserId = 0;
    for (const u of existingUsers) {
      maxUserId = Math.max(maxUserId, u.id);
      usersToInsert.push({
        id: u.id,
        username: u.username,
        password: u.password,
        namaLengkap: u.namaLengkap,
        level: u.level,
        idTahunAjaran: activeTaId,
      });
    }
    for (const r of userRows) {
      if (r.blokir === "Y") continue;
      const uname = cleanStr(r.username);
      if (!uname || existingUserMap.has(uname.toLowerCase())) continue;
      maxUserId += 1;
      usersToInsert.push({
        id: maxUserId,
        username: uname,
        password: "password",
        namaLengkap: cleanStr(r.nama_lengkap) || uname,
        level: r.level === "admin" ? "admin" : "bendahara",
        idTahunAjaran: activeTaId,
      });
    }
    if (usersToInsert.length > 0) {
      await prisma.user.createMany({ data: usersToInsert });
    }
    const adminUser = usersToInsert.find((u) => u.level === "admin") || usersToInsert[0];
    const defaultUserId = adminUser ? adminUser.id : 1;
    console.log(`✅ User: ${usersToInsert.length} (kredensial existing dipertahankan)`);

    // 6. Siswa (sanitize nis & nisn)
    const seenNis = new Set();
    const seenNisn = new Set();
    const validSiswaIds = new Set();
    let dupNisCount = 0;
    let dupNisnCount = 0;
    let fallbackKelasId = null;

    const siswaData = [];
    for (const r of siswaRows) {
      let nis = cleanStr(r.nisSiswa);
      if (nis) {
        if (seenNis.has(nis)) {
          console.warn(`⚠️  Duplikat NIS "${nis}" pada idSiswa=${r.idSiswa} (${cleanStr(r.nmSiswa)}), diset null.`);
          nis = null;
          dupNisCount += 1;
        } else {
          seenNis.add(nis);
        }
      }

      let nisn = cleanNisn(r.nisnSiswa);
      if (nisn) {
        if (seenNisn.has(nisn)) {
          console.warn(`⚠️  Duplikat NISN "${nisn}" pada idSiswa=${r.idSiswa}, diset null.`);
          nisn = null;
          dupNisnCount += 1;
        } else {
          seenNisn.add(nisn);
        }
      }

      let idKelas = r.idKelas;
      if (!validKelasIds.has(idKelas)) {
        if (!fallbackKelasId) {
          const maxK = Math.max(0, ...validKelasIds) + 1;
          await prisma.kelas.create({
            data: { id: maxK, namaKelas: "Unassigned", keterangan: "Fallback kelas migrasi" },
          });
          validKelasIds.add(maxK);
          fallbackKelasId = maxK;
        }
        idKelas = fallbackKelasId;
      }

      const jkRaw = String(r.jkSiswa || "L").trim().toUpperCase();
      const jenisKelamin = jkRaw.startsWith("P") ? "P" : "L";

      validSiswaIds.add(r.idSiswa);
      siswaData.push({
        id: r.idSiswa,
        nis,
        nisn,
        namaSiswa: cleanStr(r.nmSiswa) || `Siswa ${r.idSiswa}`,
        jenisKelamin,
        idKelas,
        hpSiswa: null,
        hpOrtu: cleanStr(r.noHpOrtu),
        statusSiswa: mapStatusSiswa(r.statusSiswa),
      });
    }
    if (siswaData.length > 0) {
      await prisma.siswa.createMany({ data: siswaData });
    }
    console.log(`✅ Siswa: ${siswaData.length} (dup NIS dibersihkan: ${dupNisCount}, dup NISN: ${dupNisnCount})`);

    // 7. PosBayar & JenisPembayaran
    const seenPosNames = new Set();
    const validPosIds = new Set();
    const posData = [];
    for (const r of posRows) {
      let namaPosBayar = cleanStr(r.nmPosBayar) || `POS-${r.idPosBayar}`;
      if (seenPosNames.has(namaPosBayar)) namaPosBayar = `${namaPosBayar} (${r.idPosBayar})`;
      seenPosNames.add(namaPosBayar);
      validPosIds.add(r.idPosBayar);
      posData.push({
        id: r.idPosBayar,
        namaPosBayar,
        keterangan: cleanStr(r.ketPosBayar),
      });
    }
    if (posData.length > 0) {
      await prisma.posBayar.createMany({ data: posData });
    }

    const validJenisIds = new Set();
    const jenisData = [];
    for (const r of jenisRows) {
      if (!validPosIds.has(r.idPosBayar)) continue;
      validJenisIds.add(r.idJenisBayar);
      jenisData.push({
        id: r.idJenisBayar,
        idPosBayar: r.idPosBayar,
        idTahunAjaran: r.idTahunAjaran,
        tipeBayar: r.tipeBayar === "bebas" ? "bebas" : "bulanan",
      });
    }
    if (jenisData.length > 0) {
      await prisma.jenisPembayaran.createMany({ data: jenisData });
    }
    console.log(`✅ PosBayar: ${posData.length}, JenisPembayaran: ${jenisData.length}`);

    // 8. TagihanBulanan & PembayaranBulanan
    const bulanMap = new Map(
      bulanRows.map((b) => [String(b.idBulan), { nama: b.nmBulan, urutan: Number(b.urutan) }])
    );
    const seenTagihanBulananKey = new Set();
    const seenNoRef = new Set();
    const tagihanBulananData = [];
    const pembayaranBulananData = [];
    let skippedTagihan = 0;

    for (const r of tagihanBulananRows) {
      if (!validSiswaIds.has(r.idSiswa) || !validJenisIds.has(r.idJenisBayar)) {
        skippedTagihan += 1;
        continue;
      }
      const bInfo = bulanMap.get(String(r.idBulan)) || {
        nama: `Bulan ${r.idBulan}`,
        urutan: Number(r.idBulan) || 1,
      };
      const uniqKey = `${r.idJenisBayar}:${r.idSiswa}:${bInfo.urutan}`;
      if (seenTagihanBulananKey.has(uniqKey)) {
        skippedTagihan += 1;
        continue;
      }
      seenTagihanBulananKey.add(uniqKey);

      const tarif = Number(r.jumlahBayar || 0);
      const isLunas = String(r.statusBayar) === "1";

      tagihanBulananData.push({
        id: r.idTagihanBulanan,
        idJenisPembayaran: r.idJenisBayar,
        idSiswa: r.idSiswa,
        bulan: bInfo.nama,
        urutanBulan: bInfo.urutan,
        tarif,
        statusBayar: isLunas ? "LUNAS" : "BELUM_BAYAR",
      });

      if (isLunas) {
        let noRef = cleanStr(r.inv);
        if (!noRef || seenNoRef.has(noRef)) {
          noRef = `MIG-SPP-${r.idTagihanBulanan}`;
        }
        seenNoRef.add(noRef);

        pembayaranBulananData.push({
          idTagihanBulanan: r.idTagihanBulanan,
          tglBayar: parseDateSafe(r.tglBayar || r.tglUpdate),
          jumlahBayar: tarif,
          idUser: defaultUserId,
          noRef,
        });
      }
    }

    if (tagihanBulananData.length > 0) {
      await prisma.tagihanBulanan.createMany({ data: tagihanBulananData });
    }
    if (pembayaranBulananData.length > 0) {
      await prisma.pembayaranBulanan.createMany({ data: pembayaranBulananData });
    }
    console.log(
      `✅ TagihanBulanan: ${tagihanBulananData.length}, PembayaranBulanan: ${pembayaranBulananData.length} (skipped orphan/dup: ${skippedTagihan})`
    );

    // 9. TagihanBebas & PembayaranBebas
    const bebasBayarByTagihan = new Map();
    for (const b of tagihanBebasBayarRows) {
      if (!bebasBayarByTagihan.has(b.idTagihanBebas)) {
        bebasBayarByTagihan.set(b.idTagihanBebas, []);
      }
      bebasBayarByTagihan.get(b.idTagihanBebas).push(b);
    }

    const seenBebasKey = new Set();
    const tagihanBebasData = [];
    const pembayaranBebasData = [];
    for (const r of tagihanBebasRows) {
      if (!validSiswaIds.has(r.idSiswa) || !validJenisIds.has(r.idJenisBayar)) continue;
      const uniqKey = `${r.idJenisBayar}:${r.idSiswa}`;
      if (seenBebasKey.has(uniqKey)) continue;
      seenBebasKey.add(uniqKey);

      const children = bebasBayarByTagihan.get(r.idTagihanBebas) || [];
      const terbayar = children.reduce((acc, c) => acc + Number(c.jumlahBayar || 0), 0);
      const totalTagihan = Number(r.totalTagihan || 0);

      tagihanBebasData.push({
        id: r.idTagihanBebas,
        idJenisPembayaran: r.idJenisBayar,
        idSiswa: r.idSiswa,
        totalTagihan,
        terbayar,
        statusBayar: terbayar >= totalTagihan && totalTagihan > 0 ? "LUNAS" : "BELUM_LUNAS",
      });

      for (const c of children) {
        let noRef = `MIG-BBS-${c.idTagihanBebasBayar}`;
        if (seenNoRef.has(noRef)) noRef = `${noRef}-${r.idTagihanBebas}`;
        seenNoRef.add(noRef);

        pembayaranBebasData.push({
          idTagihanBebas: r.idTagihanBebas,
          tglBayar: parseDateSafe(c.tglBayar),
          jumlahBayar: Number(c.jumlahBayar || 0),
          keterangan: cleanStr(c.ketBayar),
          idUser: defaultUserId,
          noRef,
        });
      }
    }
    if (tagihanBebasData.length > 0) {
      await prisma.tagihanBebas.createMany({ data: tagihanBebasData });
    }
    if (pembayaranBebasData.length > 0) {
      await prisma.pembayaranBebas.createMany({ data: pembayaranBebasData });
    }
    console.log(`✅ TagihanBebas: ${tagihanBebasData.length}, PembayaranBebas: ${pembayaranBebasData.length}`);

    // 10. Kas + jurnal_umum
    const kasData = [];
    let maxKasId = 0;
    for (const r of kasRows) {
      const id = Number(r.kode);
      maxKasId = Math.max(maxKasId, id);
      kasData.push({
        id,
        tgl: parseDateSafe(r.tgl),
        uraian: cleanStr(r.keterangan) || "Saldo Kas Awal",
        pemasukan: Number(r.jumlah || 0),
        pengeluaran: Number(r.keluar || 0),
        jenis: r.jenis === "keluar" ? "keluar" : "masuk",
        idUser: defaultUserId,
        idPosBayar: null,
      });
    }
    for (const j of jurnalRows) {
      const pengeluaran = Number(j.pengeluaran || 0);
      if (pengeluaran <= 0) continue;
      maxKasId += 1;
      kasData.push({
        id: maxKasId,
        tgl: parseDateSafe(j.tgl),
        uraian: cleanStr(j.ket) || "Pengeluaran Operasional (Jurnal Umum)",
        pemasukan: 0,
        pengeluaran,
        jenis: "keluar",
        idUser: defaultUserId,
        idPosBayar: null,
      });
    }
    if (kasData.length > 0) {
      await prisma.kas.createMany({ data: kasData });
    }
    console.log(`✅ Kas: ${kasData.length}`);

    // 11. Sync SQLite autoincrement sequences
    const tables = [
      "TahunAjaran",
      "Kelas",
      "Siswa",
      "User",
      "PosBayar",
      "JenisPembayaran",
      "TagihanBulanan",
      "PembayaranBulanan",
      "TagihanBebas",
      "PembayaranBebas",
      "Kas",
    ];
    for (const tbl of tables) {
      await prisma.$executeRawUnsafe(
        `UPDATE sqlite_sequence SET seq = COALESCE((SELECT MAX(id) FROM "${tbl}"), 0) WHERE name = '${tbl}';`
      );
    }

    console.log("\n🎉 MIGRASI SELESAI TANPA ERROR! Ringkasan SQLite sekarang:");
    const summary = {
      tahunAjaran: await prisma.tahunAjaran.count(),
      kelas: await prisma.kelas.count(),
      siswa: await prisma.siswa.count(),
      users: await prisma.user.count(),
      posBayar: await prisma.posBayar.count(),
      jenisPembayaran: await prisma.jenisPembayaran.count(),
      tagihanBulanan: await prisma.tagihanBulanan.count(),
      pembayaranBulanan: await prisma.pembayaranBulanan.count(),
      tagihanBebas: await prisma.tagihanBebas.count(),
      pembayaranBebas: await prisma.pembayaranBebas.count(),
      kas: await prisma.kas.count(),
    };
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await mysqlConn.end();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Migrasi gagal:", err);
  process.exit(1);
});
