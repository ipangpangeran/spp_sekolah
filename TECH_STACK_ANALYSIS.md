# Tech Stack Health Check: `new_sisma`

**Date:** 2026-11-25  
**Evaluated Repository:** `https://github.com/ipangpangeran/new_sisma.git`  
**Overall Architecture Verdict:** **⚠️ Needs Review** *(Core Framework: ✅ Recommended — Database Engine & API Middleware Security require pre-production remediation before cutover)*  

---

## 1. Current Stack Inventory (`new_sisma`)

| Layer | Technology in `new_sisma` | Version | Role |
| :--- | :--- | :---: | :--- |
| **Fullstack Framework** | Next.js (App Router) | `^14.2.15` | Routing, React Server/Client Components, API Route Handlers |
| **UI Library & Language** | React + TypeScript (`strict: true`) | `18.3.1` / `5.6.3` | Component rendering & end-to-end static type safety |
| **Styling & Icons** | Tailwind CSS + `clsx` + `tailwind-merge` + `lucide-react` | `3.4.14` / `0.453.0` | Utility-first styling & vector iconography |
| **ORM & Database** | Prisma ORM + **SQLite (`file:./dev.db`)** | `5.21.1` | Type-safe schema & queries (currently local file DB) |
| **Authentication** | `jose` (HS256 JWT) + `bcryptjs` | `5.9.6` / `2.4.3` | Stateless HTTP-only session cookies & password hashing |
| **AI Integration** | `@anthropic-ai/sdk` (`claude-3-5-sonnet-20241022`) | `^0.30.0` | Executive financial report summarization |

---

## 2. Four-Pillar Architectural Evaluation

### 2.1 Maintenance Ease — **Score: 8.0 / 10**
- **Active Library Maintenance:** Next.js, React 18, TypeScript 5, Tailwind CSS 3.4, Prisma, `jose`, and `@anthropic-ai/sdk` are industry-standard, actively maintained packages with minimal dependency bloat (`new_sisma` has only **10 runtime dependencies**—very lean and clean).
- **Code Modularity (No "God Classes"):** Unlike Legacy `sisma`—where `admin/keuangan_pembayaran.php` crammed **1,289 lines** of raw SQL, session state, HTML tables, inline JS, and Zenziva SMS calls into one file—`new_sisma` cleanly separates concerns:
  - `src/lib/{prisma,auth,ai,utils}.ts` encapsulates infrastructure singletons and auth/AI helpers.
  - `src/app/api/*/route.ts` isolates JSON REST handlers with atomic `prisma.$transaction(...)` blocks.
  - `src/app/dashboard/*/page.tsx` keeps UI components focused (~250–400 lines per page).
- **Maintenance Watchouts to Fix:**
  1. **Security Patch Version:** `next@^14.2.15` should be bumped to the latest `14.2.x` patch (≥ `14.2.25+`) or Next.js 15 LTS to include recent Next.js middleware/authorization security advisories.
  2. **Hardcoded AI Model ID:** `src/lib/ai.ts` hardcodes `"claude-3-5-sonnet-20241022"`. Anthropic periodically retires dated snapshot IDs; move the model identifier to `process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514"` so model upgrades never require a code redeploy.
  3. **Missing Runtime Validation & Tests:** Request bodies in `route.ts` are validated with manual `if (!x)` checks rather than `zod` schemas, and there are currently **zero automated unit/integration tests** (e.g., Vitest/Playwright) for financial calculations.
  4. **JWT Secret Fallback:** `src/lib/auth.ts` falls back to `"default-secret-key-must-be-changed-in-production-32-bytes"` if `JWT_SECRET` is unset. In production, missing `JWT_SECRET` must throw a startup error rather than silently signing tokens with a public string from GitHub.

### 2.2 Deployment Simplicity — **Score: 6.5 / 10 (⚠️ SQLite Bottleneck)**
- **Where It Shines:** Standard `npm run build && npm run start` works out of the box on any Linux VPS (Ubuntu + Nginx + PM2/systemd) or Docker container (`output: "standalone"` in `next.config.mjs`).
- **Critical Deployment Trap — SQLite (`file:./dev.db`):**
  - **Incompatible with Zero-Config Serverless Hosting (Vercel / Netlify / Cloud Run):** Serverless functions have ephemeral read-only/temporary filesystems; a local `dev.db` file will either crash on write or **wipe all student payments on every redeploy/cold start**.
  - **Single-Writer Lock on VPS:** Even on a persistent VPS, SQLite locks the entire database file during writes and complicates zero-downtime blue/green container deployments and automated off-host backups.
  - **Fix is Easy Thanks to Prisma:** Changing `provider = "postgresql"` (e.g., Neon, Supabase, or local Docker Postgres) or `provider = "mysql"` (reusing the school's existing MariaDB/MySQL server infrastructure) in `prisma/schema.prisma` immediately unlocks both zero-config cloud hosting and multi-process reliability with almost zero query changes.
- **Missing DevOps Artifacts:** `new_sisma` currently has no `Dockerfile`, `docker-compose.yml`, or GitHub Actions CI workflow (`.github/workflows/ci.yml` for `tsc --noEmit` + `next lint`).

### 2.3 Ecosystem Support — **Score: 9.5 / 10**
- **Best-in-Class Documentation & Community:** Next.js + TypeScript + Tailwind CSS + Prisma is arguably the most widely documented fullstack web stack in the world today.
- **Indonesian Talent Pool & AI Tooling:** Finding junior/mid-level Indonesian developers familiar with Next.js/Tailwind/Prisma is significantly easier in 2026 than hiring developers willing to maintain PHP 5 `mysql_*` procedural code. Furthermore, TypeScript + Prisma schemas give AI coding assistants complete structural context, accelerating future feature development by 3–5x.

### 2.4 Complexity Comparison: Legacy (`sisma`) vs Modern (`new_sisma`)

| Dimension | Legacy Stack (`sisma`) | Modern Stack (`new_sisma`) | Upgrade Trade-Off |
| :--- | :--- | :--- | :--- |
| **Runtime & DB** | PHP 5.6 (deprecated `mysql_query` removed in PHP 7.0!) + MySQL | Node.js 20/22 LTS + Next.js 14 + Prisma + SQLite/Postgres | **Existential necessity:** Legacy *cannot even run on modern PHP 8.x servers* because `mysql_*` extensions were removed a decade ago, forcing the school onto unpatched, vulnerable PHP 5/early-7 hosting! |
| **Security Posture** | Critical SQL injection vectors, `md5()` hashes, hardcoded API keys in repo (`Wapi.php`, `checkout.php`), `>= 0` student login bypass | Parameterized Prisma queries (SQLi immune), Bcrypt cost-10, `jose` HTTP-only JWT cookies, `.env` secret isolation | **Massive win** (once `middleware.ts` and `GET` route session checks are added). |
| **Build & Deploy Workflow** | Edit `.php` file over FTP/cPanel → instant change (high risk of live syntax breaks—e.g. truncated SQL in `keuangan_pembayaran.php:758`) | Type-checked build (`next build` catches broken types/imports before deploy) → Node process / Docker / Vercel | Requires learning Git + CI/build step (~1–2 weeks ramp-up for traditional cPanel admins), **100% worth it** to prevent live financial bugs. |
| **Data Integrity** | Multi-step raw `UPDATE` + `INSERT` without SQL transactions (partial failure leaves paid bills out of sync) | `prisma.$transaction(async (tx) => ...)` guarantees atomic bill + receipt + cash ledger updates | Eliminates silent ledger drift completely. |

---

## 3. Final Verdict & Actionable Roadmap

### Verdict: **⚠️ Needs Review**
> **Why `⚠️ Needs Review` instead of unconditional `✅ Recommended`?**  
> The **framework choices** (Next.js 14, TypeScript, Tailwind CSS, Prisma, `jose`, Bcrypt) are **✅ Recommended**—modern, maintainable, and overwhelmingly worth the upgrade over end-of-life PHP `mysql_*`. However, deploying `new_sisma` *as-is* to production carries three concrete engineering risks that **must be resolved before cutover**:

1. **Switch Production Datasource from SQLite to PostgreSQL or MySQL/MariaDB**
   - Update `prisma/schema.prisma` (`provider = "postgresql"` or `"mysql"`), convert monetary `Float` columns to `Decimal` / `Int`, and configure automated daily `pg_dump` / `mysqldump` backups to object storage.
2. **Close Unauthenticated Read APIs & Enforce `middleware.ts`**
   - Add `src/middleware.ts` using `jose` to protect `/dashboard/:path*` and `/api/:path*`, require `getSession()` on all `GET` endpoints, fail fast in production if `JWT_SECRET` is missing, and upgrade `next` to the latest patched `14.2.x` / `15.x` release.
3. **Add `Dockerfile` + GitHub Actions CI + `zod` Validation**
   - Provide a single `docker-compose.yml` (Next.js standalone + Postgres/MariaDB) so the school IT admin can deploy reproducibly on any Indonesian VPS (Biznet Gio, IDCloudHost, Contabo, etc.) without serverless vendor lock-in.
