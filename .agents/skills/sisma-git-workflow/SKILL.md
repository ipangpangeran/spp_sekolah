---
name: sisma-git-workflow
description: Standar git, commit, dan pencegahan kebocoran data.
---

# General Git & Version Control Playbook

## 1. Safety Guardrails (Dilarang Keras!)
- **JANGAN PERNAH** commit file sensitif atau data pribadi:
  - `.env`, `.env.local`, `.env.production`
  - `*.pem`, `*.key`, `*.p12` (Sertifikat SSL/Kunci Private)
  - `*.db`, `*.sqlite`, `*.db-wal`, `*.db-shm` (Database local)
  - `node_modules/`, `vendor/`, `.terraform/` (Dependency & State)
  - `dist/`, `build/`, `.next/`, `target/` (Build Output)
  - `*.log`, `logs/` (File Log Eksekusi)
  - `coverage/` (Hasil test coverage)
- Pastikan `.gitignore` selalu aktif. Jika ragu, cek list di bagian bawah skill ini.

## 2. Conventional Commits (Format Wajib)
Gunakan format ini agar history commit mudah dibaca dan di-audit:
`<tipe>(<scope>): <deskripsi singkat>`

### Tipe Izin:
- `feat`: Fitur baru
- `fix`: Perbaikan bug
- `refactor`: Perubahan kode tanpa ubah fitur (clean-up, optimasi)
- `docs`: Perubahan dokumentasi (README, comments)
- `style`: Formatting (spasi, semi-colon, tanpa ubah logika)
- `test`: Penambahan/modifikasi test
- `chore`: Update config, dependency, build process
- `ci`: Perubahan konfigurasi CI/CD

### Contoh:
- `feat(auth): tambah login via OAuth Google`
- `fix(invoice): perbaiki kalkulasi pajak dp`
- `refactor(db): pisahkan model user ke file terpisah`
- `chore(deps): update react ke versi 19`

*Hindari: "update", "fix bug", "edit dikit", "wip".*

## 3. Atomic Commits
- 1 Commit = 1 logical change. Jangan campur fitur baru sama fix bug di satu commit.
- Jika mengerjakan banyak hal, gunakan `git add -p` untuk stage bagian yang relevan saja.

## 4. Pre-Commit Verification Checklist
Sebelum `git commit`, pastikan:
1. **Clean Status:** `git status` tidak menampilkan file sensitif (`.env`, `*.db`).
2. **Lint/Build:** Kode sudah lolos linting dan build tidak error.
3. **No Secrets:** Cek content file yang di-stage, pastikan tidak ada API Key atau Password hardcode.
4. **Descriptive Message:** Pesan commit jelas dan dalam bahasa yang konsisten (ID/EN).

## 5. Branching Strategy (Simple)
- `main` / `master`: Branch production (selalu stable).
- `dev` / `staging`: Branch untuk integrasi fitur sebelum production.
- `feature/<nama-fitur>`: Branch untuk pengembangan fitur baru. Contoh: `feature/login-oauth`.
- `fix/<bug-description>`: Branch untuk perbaikan bug.

## 6. Minimal `.gitignore` Template
Pastikan project memiliki file ini:

ignore
Dependencies
node_modules/
vendor/
.go

Build Outputs
dist/
build/
.next/
target/

Environment & Secrets
.env
.env.local
.env.production
*.pem
*.key

Databases
*.db
*.sqlite
*.db-wal
*.db-shm

OS Files
.DS_Store
Thumbs.db

IDE
.vscode/
.idea/
*.swp
*.swo

Logs
*.log
logs/

Test Coverage
coverage/

Misc
*.tmp
*.bak
