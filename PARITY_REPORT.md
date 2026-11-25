# Feature Parity Report: Legacy (`sisma`) vs Modern (`new_sisma`)

**Date:** 2026-11-25  
**Legacy Repository:** `https://github.com/ipangpangeran/sisma.git` (PHP 5/7 Procedural, MySQL `mysql_*`, AdminLTE 2)  
**Modern Repository:** `https://github.com/ipangpangeran/new_sisma.git` (Next.js 14 App Router, TypeScript, Prisma ORM, SQLite, Tailwind CSS, Claude AI)  
**Target Institution:** SMA Swasta Persiapan Stabat  

---

## 1. Executive Summary

`new_sisma` successfully modernizes the **core foundation** of school financial management—delivering secure Bcrypt/JWT authentication, a clean responsive UI, atomic SPP monthly payment recording with automatic cash ledger synchronization, synthetic demo readiness, and an innovative Zero-PII AI Financial Report Assistant powered by Anthropic Claude.

However, from a **production cutover perspective**, `new_sisma` is currently an **MVP / Startup Review Preview (~40% functional parity)** rather than a drop-in replacement for `sisma`. While `new_sisma/prisma/schema.prisma` defines 12 domain models covering nearly all core tables, the **UI pages and API route handlers** only expose a subset of operations. Several mission-critical workflows used daily or annually by the school treasurer and operator—such as **Flexible/Building Fee (`Tagihan Bebas`) payments, Tariff Configuration, Payment Cancellation (Undo), Class Matrix & Arrears Reports, Excel Import/Export, and Class Promotion/Graduation**—are not yet wired up in `new_sisma`.

---

## 2. Comprehensive Feature Comparison Matrix

| Feature | Legacy Status | Modern Status | Gap Analysis |
| :--- | :---: | :---: | :--- |
| **1. Authentication & Session Security** | **Implemented** (`cek_login.php`, `cek_login_bendahara.php`, `cek_login_siswa.php`) | **Partial** (`/login`, `/api/auth/{login,logout,me}`) | **Security upgraded, but GET endpoints & middleware are incomplete.** Legacy used weak `md5()` for staff, plaintext passwords for students, and had a critical auth bypass bug (`$hitungadmin >= 0` in `cek_login_siswa.php`). Modern upgrades to `bcryptjs` + HTTP-only JWT (`jose`). **Gap:** Modern lacks `src/middleware.ts` and does **not** check `getSession()` on `GET` endpoints (`/api/students`, `/api/cash`, `/api/payments/history`, `/api/reports/summary`), exposing read access without authentication. |
| **2. Role-Based Access Control (RBAC)** | **Implemented** (`admin`, `bendahara`, `siswa`, `koperasi`) | **Partial** (`admin`, `bendahara`, `siswa`) | Modern enforces role checks on `POST`/`PUT`/`DELETE` mutations (`admin`/`bendahara` for writes, `admin` only for student archive). **Gap:** Sidebar navigation and `/dashboard` views do not adapt by role; logging in as `siswa` renders the staff dashboard instead of a student portal. |
| **3. Public Landing Page & Privacy Policy** | **Missing** (Redirects straight to login) | **Implemented** (`/`, `/privacy`) | **Net-new capability in Modern.** Provides a SaaS product landing page, transparent feature status badges, and an explicit data/AI privacy policy. |
| **4. Executive Financial Dashboard** | **Implemented** (`admin/home_admin_row.php`) | **Implemented** (`/dashboard`, `/api/reports/summary`) | Modern provides 4 KPI cards (SPP Collected, SPP Outstanding, Net Cash Balance, Active Students), collection rate progress bar, and 6 latest payment transactions. Legacy also showed daily income/expense counters. |
| **5. Academic Year Management (`Tahun Ajaran`)** | **Implemented** (`admin/master_tahun.php`) | **Missing** (Schema & seed only) | `TahunAjaran` exists in `schema.prisma`, but Modern has **no UI or API** to create, edit, or switch the active academic year. Header hardcodes `T.A. 2026/2027 (Aktif)`. |
| **6. Class / Cohort Management (`Data Kelas`)** | **Implemented** (`admin/master_kelas.php`) | **Partial** (`GET /api/classes` only) | Modern only fetches classes for dropdown filters. **Gap:** No UI or `POST`/`PUT`/`DELETE` endpoints to create, rename, or delete class cohorts (`X A`, `XI SAINTEK`, etc.). |
| **7. Student Directory & CRUD (`Data Siswa`)** | **Implemented** (`admin/master_siswa.php`) | **Partial** (`/dashboard/students`, `/api/students`, `/api/students/[id]`) | Modern implements live search (Name/NIS/NISN), class filter, Add Student modal, and Soft-Archive (`statusSiswa = 'ALUMNI'`). **Gap:** `PUT /api/students/[id]` exists in backend, but **Edit Student modal/form is missing in UI**; legacy fields `agamaSiswa`, `nmOrtu`, `alamatOrtu` are omitted from schema. |
| **8. Student Batch Excel Import** | **Implemented** (`master_siswa.php?act=import`, `.xls`) | **Missing** | Legacy allowed bulk `.xls` upload via `excel_reader.php`. Modern requires one-by-one manual student entry via modal. |
| **9. Class Promotion & Transfer (`Kenaikan / Pindah Kelas`)** | **Implemented** (`admin/master_kenaikankelas.php`) | **Missing** | Legacy supports selecting a source class, checking students in bulk, and moving them to a target class while keeping historical bills intact. Completely absent in Modern. |
| **10. Batch Student Graduation (`Kelulusan`)** | **Implemented** (`admin/master_kelulusan.php`) | **Partial** (Single-student archive only) | Legacy supports bulk graduating an entire Grade XII cohort to `Lulus`. Modern only supports archiving one student at a time (`DELETE /api/students/[id]` → `ALUMNI`). |
| **11. Student ID / Tuition Card Printing** | **Implemented** (`cetakkartu.php`, `cetakdatasiswa.php`) | **Missing** | Legacy generates printable student cards used with barcode scanners at the payment counter. Missing in Modern. |
| **12. Staff / User Account Management** | **Implemented** (`admin/master_admin.php`) | **Missing** (Seed only) | Modern has no UI or API for admins to add treasurers/operators, reset passwords, or block inactive staff accounts (`blokir`). |
| **13. Fee Categories & Fee Types (`Pos Bayar` & `Jenis Bayar`)** | **Implemented** (`keuangan_posbayar.php`, `keuangan_jenisbayar.php`) | **Missing** (Schema & seed only) | `PosBayar` and `JenisPembayaran` exist in Prisma, but Modern has **no UI or API** to configure new fee categories (e.g., Seragam, Uang Ujian, Pembangunan) or link them to academic years. |
| **14. Tariff Assignment Matrix (`Setting Tarif`)** | **Implemented** (`keuangan_tarif_bulanan.php`, `keuangan_tarif_bebas.php`) | **Missing** (Hardcoded Rp 250.000) | **Critical Gap.** Legacy assigns tariffs bulk-per-class or custom-per-student (scholarship/discount) for both Bulanan and Bebas fees. Modern hardcodes `defaultMonthlyTarif = 250000` inside `POST /api/students` (whereas actual SMA Persiapan SPP is `Rp 125.000`) and cannot edit student tariffs. |
| **15. Monthly SPP Payment Counter (`Tagihan Bulanan`)** | **Implemented** (`keuangan_pembayaran.php`, `keuangan_pembayaran_bulanan.php`) | **Implemented** (`/dashboard/payments`, `POST /api/payments/spp`) | Modern provides a clean 12-month visual grid, server-side tariff verification, duplicate-payment prevention, and atomic `Kas` insertion via `prisma.$transaction`. **Gap:** Cannot pay multiple months in one click, cannot backdate `tglBayar` (for late-reported bank transfers), and lacks `caraBayar` (`Tunai` vs `Transfer`). |
| **16. Non-SPP Flexible / Installment Fees (`Tagihan Bebas`)** | **Implemented** (`keuangan_pembayaran_bebas.php`, `pembayaran_tagihan_bebas.php`) | **Missing** (Schema & GET detail only) | **Critical Gap.** `TagihanBebas` and `PembayaranBebas` exist in Prisma and `seed.ts`, and `GET /api/students/[id]` includes them, **but `/dashboard/payments` has zero UI tabs/forms and zero API endpoints** to record partial installments (e.g., Uang Gedung / Pembangunan). |
| **17. Payment Cancellation / Reversal (`Batal / Hapus Bayar`)** | **Implemented** (`hapus_bulanan`, `angsuran&act=hapus`) | **Missing** | **Critical Operational Gap.** If a treasurer clicks "Bayar Sekarang" on the wrong student or month in Modern, there is **no way to void/reverse** the payment or its corresponding `Kas` entry from the UI or API. |
| **18. Payment Receipts / Slip Printing (`Kwitansi`)** | **Implemented** (`kwitansi.php`, 6 `slip_*.php` templates) | **Partial** (Single-month modal `window.print()`) | Modern generates a clean digital receipt modal per monthly payment with unique `noRef`. **Gap:** Cannot print a combined daily receipt for multiple months/items paid together (`Cetak Semua Slip Hari Ini`) or filter slips by date range. |
| **19. Cash Flow & Expense Ledger (`Kas` & `Jurnal Umum`)** | **Implemented** (`com_kas/{masuk,keluar}.php`, `keuangan_jurnalumum.php`) | **Partial** (`/dashboard/cash`, `/api/cash`) | Modern unifies `Kas Masuk` and `Kas Keluar` into one clean ledger with auto-synced SPP income. **Gap:** Missing Edit/Delete on erroneous cash rows, date-picker input (always uses `now()`), multi-row expense batch input, and `PosBayar` selector in the modal UI. |
| **20. Financial & Arrears Reports (`Laporan`)** | **Implemented** (10 dedicated report views in `admin/laporan_*.php`) | **Partial** (`/dashboard/reports`, `/api/reports/summary`) | **Critical Gap.** Modern only has a 12-month school-wide aggregate summary table. It lacks **Class Payment Matrix (`Laporan Pembayaran Per Kelas`)**, **Student Arrears List (`Laporan Tagihan/Tunggakan Siswa`)**, **Daily/Period Collector Recap**, and **Per-Pos Bayar Report**. |
| **21. Excel & Official Kop Surat PDF Exports** | **Implemented** (7 `excel_*.php` & 13 `cetak_*.php` / `pdf_*.php`) | **Missing** | Legacy exports `.xls` spreadsheets and print-ready school letterhead reports with Principal & Treasurer signature blocks. Modern has no Excel/CSV export (`xlsx` is not installed in `new_sisma`) and no print stylesheet for reports. |
| **22. Student Self-Service Portal** | **Implemented** (`index-siswa.php`, `siswa/laptanggungan.php`) | **Missing** | Legacy provided a dedicated student view to inspect personal monthly/bebas arrears and print personal billing statements. Missing in Modern. |
| **23. WhatsApp & SMS Billing Notifications** | **Partial** (`Wapi.php`, `wa.me` links, Zenziva SMS in `keuangan_pembayaran_bebas.php`) | **Missing** | Legacy supported Zenziva SMS triggers, `Wapi.php` (Wapisender), and `api.whatsapp.com` deep links for receipts/arrears. Completely absent in Modern. |
| **24. Online Payment Gateway (Midtrans Snap)** | **Partial** (`data.php`, `cs.php`, `notif.php`, `checkout.php`) | **Missing** (Planned in README) | Legacy had Midtrans Snap token & webhook scripts (`notif.php`), though `data.php` had a hardcoded `gross_amount => 94000` bug and stored keys inside `identitas.nipKaTU`/`nipBendahara`. Not yet implemented in Modern. |
| **25. School Identity Settings & DB Backup/Restore** | **Implemented** (`pengaturan_identitas.php`, `backup-datas.php`, `restore.php`) | **Missing** (Hardcoded strings) | `Pengaturan` table exists in Prisma, but Modern has no Settings UI/API (school name/address are hardcoded in JSX) and no one-click database backup/restore utility. |
| **26. AI Financial Report Assistant (Claude)** | **Missing** | **Implemented** (`/dashboard/reports`, `/api/ai/report-summary`) | **Net-new capability in Modern.** Server-side Anthropic Claude integration summarizing aggregate collection rates and cash balances with strict Zero-PII guardrails. |
| **27. Auxiliary Modules: Student Savings (`Tabungan`) & Store Debt (`Hutang Toko`)** | **Partial** (`com_nasabah/`, `com_transaksi/`, `hutangtoko.php`) | **Missing** (Deliberate Deprecation) | Legacy codebase included cooperative savings (`transaksi`: 0 rows in prod DB) and store debt (`hutangtoko`: 1 dummy row in prod DB), both commented out in `menu-admin.php` for Admin. Safe to deprecate. |

---

## 3. Critical Missing Features & Architectural Recommendations

Before `new_sisma` can replace `sisma` in daily production at SMA Swasta Persiapan Stabat, the following **P0 (Blocker)** and **P1 (High Priority)** gaps must be resolved:

### P0 — Production Cutover Blockers
1. **Enforce Authentication Middleware on All Protected APIs & Pages**
   - **Problem:** `GET /api/students`, `GET /api/students/[id]`, `GET /api/cash`, `GET /api/payments/history`, and `GET /api/reports/summary` currently return full student PII and financial records without calling `getSession()`.
   - **Implementation:** Add Next.js `src/middleware.ts` verifying the `sisma_session` JWT via `jose` (Edge-compatible) for all `/dashboard/*` and `/api/*` routes (excluding `/api/auth/login`), and enforce role-scoped data filtering for `siswa`.
2. **Configurable Fee Structure & Tariff Matrix (`PosBayar`, `JenisPembayaran`, `Tarif`)**
   - **Problem:** `POST /api/students` hardcodes `Rp 250.000/month`, whereas actual school SPP rates vary by cohort/scholarship (e.g., `Rp 125.000/month`).
   - **Implementation:** Add `/dashboard/tariffs` + `/api/tariffs` supporting bulk class tariff assignment and per-student custom tariff overrides, updating `TagihanBulanan.tarif` (for unpaid months) and `TagihanBebas.totalTagihan`.
3. **Flexible Fee (`Tagihan Bebas`) Counter & Partial Installment API**
   - **Problem:** Schema and seed already exist (`TagihanBebas`, `PembayaranBebas`), but treasurers cannot collect Building/Uniform installments.
   - **Implementation:** Add `POST /api/payments/bebas` (using `prisma.$transaction` to insert `PembayaranBebas`, increment `TagihanBebas.terbayar`, toggle `LUNAS` when `terbayar >= totalTagihan`, and log `Kas`) and add a second tab/section on `/dashboard/payments`.
4. **Payment Cancellation / Void (`Batal Bayar`) with Audit Reversal**
   - **Problem:** Human data-entry errors at a busy school counter are inevitable; without cancellation, the database must be edited manually.
   - **Implementation:** Add `POST /api/payments/cancel` (restricted to `admin` / `bendahara`) that atomically deletes/voids `PembayaranBulanan` or `PembayaranBebas`, resets `TagihanBulanan.statusBayar` to `BELUM_BAYAR` (or recalculates `TagihanBebas.terbayar`), and inserts a reversing entry or removes the linked `Kas` record by `noRef`.
5. **Core Operational Reports & Excel Export (`Per Kelas` & `Tunggakan Siswa`)**
   - **Problem:** School leadership and homeroom teachers (*Wali Kelas*) rely on the 12-month class checklist and student arrears report.
   - **Implementation:** Expand `/dashboard/reports` with tabs for **Matriks SPP Per Kelas**, **Daftar Tunggakan Siswa**, and **Rekap Kas Per Periode**, plus client/server `.xlsx` export (`xlsx` or `exceljs`) and `@media print` Kop Surat headers with dynamic `Pengaturan` signatures.

### P1 — Annual & Operational Essentials
6. **Student Lifecycle Tools (Edit Modal, Excel Import, `Kenaikan Kelas`, `Kelulusan`)**
   - Wire a Student Edit modal to the existing `PUT /api/students/[id]` endpoint.
   - Add bulk class promotion (`PUT /api/students/promote`) and graduation (`PUT /api/students/graduate`) endpoints + `.xlsx` batch student import with duplicate NIS/NISN preview.
7. **Master Data & Settings CRUD (`TahunAjaran`, `Kelas`, `User`, `Pengaturan`)**
   - Build `/dashboard/settings` and `/dashboard/master` so admins can switch academic years, manage classes, manage treasurer accounts, and edit school letterhead metadata without code changes.
8. **WhatsApp Receipt & Arrears Deep-Link / Gateway Integration**
   - Add zero-cost `https://wa.me/62...` pre-filled receipt/reminder buttons immediately on payment completion and arrears rows, with optional server-side webhook integration to Wapisender/Fonnte configured via `.env`.

### Deliberate Deprecations (Recommended to Drop)
- **`hutangtoko` & `detailtoko.php` (Store Debt):** Only 1 test row (`HT001`, nominal `1000`) exists in legacy DB and menu item is commented out. Deprecate.
- **`com_nasabah` & `com_transaksi` (`Tabungan Siswa`):** `transaksi` table has `0` rows in production DB and `siswa.saldo` is `NULL` across students. Deprecate from core SPP app unless cooperative (`koperasi`) module is explicitly revived later.
- **Zenziva SMS Gateway:** Legacy hardcoded expired SMS credentials in `keuangan_pembayaran_bebas.php`. Replace completely with WhatsApp notifications.
