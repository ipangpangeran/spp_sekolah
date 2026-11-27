---
name: sisma-regression-guard
description: Guardrail sebelum commit fitur atau perbaikan bug SISMA.
---

# SISMA Regression Guard

Selama fase stabilisasi dan pengembangan **SISMA (Sistem Manajemen Sekolah Modern)**, stabilitas data keuangan dan integritas audit trail adalah prioritas utama. Bug fix yang ceroboh atau refactoring liar dapat menyebabkan *drift* data kas, duplikasi kwitansi, atau kebocoran data siswa.

---

## 1. Core Invariants (Aturan Absolut)

### 1.1. Prinsip Isolasi Scope (Strict Ticket Scope)
- Developer/AI Agent **HANYA BOLEH** mengubah kode yang berhubungan langsung dengan akar masalah.
- **DILARANG "OPPORTUNISTIC REFACTORING"**: Dilarang merombak arsitektur, mengganti library, atau memformat ulang file di luar lingkup tiket bug.
- Satu branch/commit hanya menyelesaikan satu isu atau kelompok isu yang berelasi erat.

### 1.2. Integritas Transaksi Keuangan (Atomicity)
- Seluruh operasi pembayaran (SPP Bulanan & Tagihan Bebas) wajib menggunakan **`prisma.$transaction()`**.
- Satu transaksi pembayaran wajib secara atomic:
  1. Update status `TagihanBulanan` / `TagihanBebas`.
  2. Insert record di `PembayaranBulanan` / `PembayaranBebas` (Audit Trail).
  3. Insert record di `Kas` (Pemasukan).
- **DILARANG** melakukan `UPDATE` dan `INSERT` terpisah tanpa wrapped dalam `prisma.$transaction()`.

### 1.3. Keamanan Data & Autentikasi
- Semua endpoint di `/api/*` dan `/dashboard/*` **WAJIB** melewati middleware autentikasi (`getSession()`).
- **DILARANG** mengekspos data sensitif (NISN, No HP Ortu, Status Bayar) ke role `siswa` atau guest.
- Gunakan `Zod` untuk validasi semua request body di `route.ts` sebelum menyentuh Prisma.

### 1.4. Verifikasi Matriks Dampak Cascading
Sebelum menyentuh satu modul, wajib identifikasi ketergantungan silang:

| Modul yang Diubah | Modul Terdampak Wajib Dicek | Potensi Risiko Regresi |
| :--- | :--- | :--- |
| **Pembayaran SPP Bulanan** | Laporan Ringkasan, AI Report Assistant, Kas Ledger | Duplikasi `noRef`, saldo kas selisih, invoice ganda. |
| **Tagihan Bebas (Cicilan)** | Ledger Kas, Dashboard KPI | Total `terbayar` tidak sinkron, kas tidak terupdate. |
| **Pembatalan Bayar (Void)** | Ledger Kas, Tagihan Parent | Kas harus di-reverse/void, tagihan harus kembali `BELUM_BAYAR`. |
| **Manajemen Siswa (CRUD)** | Tagihan Bulanan, Laporan Arrears | Tarif SPP otomatis (Rp 250.000) salah saat create/update siswa. |
| **Konfigurasi Tarif** | Semua Proses Pembayaran | Tarif baru tidak apply ke bulan yang sudah terlanjur dibuat. |
| **Laporan & Export** | Data Kas, Data Pembayaran | Export Excel/PDF tidak mencerminkan data real-time (cache issue). |

---

## 2. File & Area Sensitif (Peta File)

- **Middleware & Auth**:
  - `src/middleware.ts` (Wajib dibuat: proteksi route, cek JWT).
  - `src/lib/auth.ts` (Session management, `getSession()`).

- **Core API Routes**:
  - `src/app/api/payments/spp/route.ts` (Jantung pembayaran SPP atomic).
  - `src/app/api/payments/history/route.ts` (Riwayat pembayaran).
  - `src/app/api/students/route.ts` (Create siswa & auto-generate tagihan).
  - `src/app/api/students/[id]/route.ts` (Update/Arsip siswa).
  - `src/app/api/cash/route.ts` (Ledger pemasukan/pengeluaran).

- **Dashboard UI Pages**:
  - `src/app/dashboard/payments/page.tsx` (Loket pembayaran: filter siswa, grid bulan, modal bayar).
  - `src/app/dashboard/students/page.tsx` (Direktori siswa: tabel, modal add/edit).
  - `src/app/dashboard/cash/page.tsx` (Jurnal umum kas).
  - `src/app/dashboard/reports/page.tsx` (Ringkasan 12 bulan & AI Assistant).
  - `src/app/dashboard/layout.tsx` (Sidebar navigasi).

- **Infrastructure**:
  - `prisma/schema.prisma` (Model: Siswa, TagihanBulanan, PembayaranBulanan, Kas, dll).
  - `src/lib/prisma.ts` (Singleton instance Prisma Client).
  - `src/app/layout.tsx` (Root layout).

---

## 3. Regression Checklist (Wajib Dicek Sebelum Commit)

> [!CAUTION]
> Jangan commit sebelum checklist ini dijawab "YA" atau "VERIFIED".

- [ ] **Scope Isolation**: Hanya file yang relevan dengan tiket bug yang termodifikasi.
- [ ] **Atomic Transaction**: Jika fix menyangkut pembayaran atau kas, pastikan `prisma.$transaction()` digunakan.
- [ ] **Middleware Enforced**: Tidak ada endpoint API yang bisa diakses tanpa login.
- [ ] **Zero Console Error**: DevTools console bersih dari React warnings.
- [ ] **Build Verification**: `next build` sukses tanpa error.
- [ ] **Data Safety**: Tidak ada `DROP TABLE`, `DELETE` masal tanpa `WHERE`.
- [ ] **Financial Integrity**: No floating-point anomalies untuk nominal Rupiah.

---

## 4. Format Laporan Fixing (Commit & PR Standard)

markdown
[FIX] <Deskripsi Singkat Bug>
- Akar Masalah: Penjelasan teknis kenapa bug terjadi.
- Solusi: Kode/logika yang diperbaiki.
- Area Terisolasi: File yang dimodifikasi.
- Uji Dampak (Cascading Test):
  - Modul Pembayaran: [PASSED / NA]
  - Modul Kas: [PASSED / NA]
  - Modul Laporan: [PASSED / NA]
  - Modul Siswa: [PASSED / NA]
- Build Status: next build lolos 100%.


---

## 5. Do's & Don'ts

### Do's:
- Selalu uji "Happy Path" dan "Edge Case".
- Gunakan `process.env` untuk semua secrets.
- Test skenario **Pembatalan Bayar (Void)** jika fitur sudah ada.

### Don'ts:
- **JANGAN** mengabaikan error di console.
- **JANGAN** mengubah logika `prisma.$transaction()` tanpa testing.
- **JANGAN** membiarkan `GET` endpoint API return data tanpa cek session.
- **JANGAN** melakukan refactoring UI massal tanpa persetujuan.