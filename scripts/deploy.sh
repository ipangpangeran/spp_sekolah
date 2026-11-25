#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# SISMA Production Deploy Script (Ubuntu + PM2 + Next.js + Prisma SQLite)
# Usage:
#   bash scripts/deploy.sh            # Standard deploy (git pull --ff-only)
#   bash scripts/deploy.sh --force    # Reset tracked files if server has dirty tracked diffs
# ==============================================================================

APP_DIR="${APP_DIR:-/var/www/sisma_new}"
PM2_APP_NAME="${PM2_APP_NAME:-sisma-app}"
BRANCH="${BRANCH:-main}"
APP_PORT="${APP_PORT:-9000}"
FORCE_RESET=false

if [[ "${1:-}" == "--force" ]]; then
  FORCE_RESET=true
fi

log() {
  echo -e "\n[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

cd "$APP_DIR"

# 1. Auto-backup SQLite database before any pull/build/migration
DB_FILE="$APP_DIR/prisma/dev.db"
BACKUP_DIR="$APP_DIR/prisma/backups"
if [[ -f "$DB_FILE" ]]; then
  mkdir -p "$BACKUP_DIR"
  BACKUP_PATH="$BACKUP_DIR/dev.db.$(date '+%Y%m%d_%H%M%S').bak"
  if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$DB_FILE" ".backup '$BACKUP_PATH'"
  else
    cp "$DB_FILE" "$BACKUP_PATH"
  fi
  log "✅ Database backed up to: $BACKUP_PATH"

  # Keep only the 10 most recent backups
  ls -1t "$BACKUP_DIR"/dev.db.*.bak 2>/dev/null | tail -n +11 | xargs -r rm -f
else
  log "⚠️  No existing $DB_FILE found; skipping pre-deploy backup."
fi

# 2. Pull latest code from GitHub
log "📥 Fetching origin/$BRANCH..."
git fetch origin "$BRANCH"

if [[ "$FORCE_RESET" == true ]]; then
  log "⚠️  --force enabled: resetting tracked files to origin/$BRANCH (untracked DB/.env preserved)..."
  git reset --hard "origin/$BRANCH"
else
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "❌ Tracked files have local modifications on server:"
    git status --short
    echo "   Run 'bash scripts/deploy.sh --force' to discard tracked diffs and match origin/$BRANCH."
    exit 1
  fi
  git pull --ff-only origin "$BRANCH"
fi

# 3. Install dependencies
log "📦 Installing Node dependencies..."
if [[ -f package-lock.json ]]; then
  npm ci --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

# 4. Prisma client & safe schema sync
log "🗄️  Generating Prisma client & syncing schema..."
npx prisma generate
npx prisma db push

# 5. Build Next.js production bundle
log "🏗️  Building Next.js app..."
npm run build

# 6. Reload or start PM2 process
log "🚀 Restarting PM2 process ($PM2_APP_NAME)..."
if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_APP_NAME" --update-env
else
  pm2 start npm --name "$PM2_APP_NAME" -- start
fi
pm2 save

# 7. Health check
log "🩺 Running health check on http://localhost:$APP_PORT/login..."
sleep 2
for i in {1..10}; do
  if curl -sf "http://localhost:$APP_PORT/login" >/dev/null; then
    log "✅ Deploy succeeded! $PM2_APP_NAME is online and responding on port $APP_PORT."
    pm2 status "$PM2_APP_NAME"
    exit 0
  fi
  sleep 2
done

echo "❌ Health check failed after 20s! Check logs with: pm2 logs $PM2_APP_NAME --lines 50"
exit 1
