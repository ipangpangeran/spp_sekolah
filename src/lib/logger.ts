import fs from 'node:fs';
import path from 'node:path';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface AppLogEntry {
  ts?: string;
  tsWib?: string;
  level: LogLevel;
  event: string;
  method?: string;
  path?: string;
  status?: number;
  durationMs?: number;
  slow?: boolean;
  userId?: number | null;
  username?: string | null;
  role?: string | null;
  ip?: string | null;
  detail?: Record<string, unknown>;
  error?: string;
}

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
const ACTIVE_LOG_FILE = path.join(LOG_DIR, 'sisma.log');
const MAX_RETENTION_DAYS = 30;

function getWibDateKey(date = new Date()): string {
  const wib = new Date(date.getTime() + WIB_OFFSET_MS);
  const y = wib.getUTCFullYear();
  const m = String(wib.getUTCMonth() + 1).padStart(2, '0');
  const d = String(wib.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatWibTimestamp(date = new Date()): string {
  const wib = new Date(date.getTime() + WIB_OFFSET_MS);
  const y = wib.getUTCFullYear();
  const m = String(wib.getUTCMonth() + 1).padStart(2, '0');
  const d = String(wib.getUTCDate()).padStart(2, '0');
  const hh = String(wib.getUTCHours()).padStart(2, '0');
  const mm = String(wib.getUTCMinutes()).padStart(2, '0');
  const ss = String(wib.getUTCSeconds()).padStart(2, '0');
  const ms = String(wib.getUTCMilliseconds()).padStart(3, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}.${ms} +07:00`;
}

function msUntilNextWibMidnightPlus1s(now = new Date()): number {
  const wibNow = new Date(now.getTime() + WIB_OFFSET_MS);
  const nextMidnightWibUtc =
    Date.UTC(
      wibNow.getUTCFullYear(),
      wibNow.getUTCMonth(),
      wibNow.getUTCDate() + 1,
      0,
      0,
      1,
      0
    ) - WIB_OFFSET_MS;
  return Math.max(1000, nextMidnightWibUtc - now.getTime());
}

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function pruneOldLogs() {
  try {
    ensureLogDir();
    const cutoff = Date.now() - MAX_RETENTION_DAYS * 86400000;
    for (const file of fs.readdirSync(LOG_DIR)) {
      if (!/^sisma-\d{4}-\d{2}-\d{2}\.log$/.test(file)) continue;
      const fullPath = path.join(LOG_DIR, file);
      const stat = fs.statSync(fullPath);
      if (stat.mtimeMs < cutoff) {
        fs.unlinkSync(fullPath);
      }
    }
  } catch {
    // Non-fatal
  }
}

let currentLogDateKey = getWibDateKey();
let rotationScheduled = false;

/**
 * Rotates `logs/sisma.log` -> `logs/sisma-YYYY-MM-DD.log` using the previous WIB date.
 */
export function rotateLogIfNeeded(targetArchiveDate?: string) {
  try {
    ensureLogDir();
    if (!fs.existsSync(ACTIVE_LOG_FILE)) return;
    const stat = fs.statSync(ACTIVE_LOG_FILE);
    if (stat.size === 0) return;

    const archiveKey = targetArchiveDate || getWibDateKey(stat.mtime);
    const rotatedPath = path.join(LOG_DIR, `sisma-${archiveKey}.log`);

    if (fs.existsSync(rotatedPath)) {
      // Append if archive for that date already exists (e.g. restart mid-day)
      const existingContent = fs.readFileSync(ACTIVE_LOG_FILE);
      fs.appendFileSync(rotatedPath, existingContent);
      fs.truncateSync(ACTIVE_LOG_FILE, 0);
    } else {
      fs.renameSync(ACTIVE_LOG_FILE, rotatedPath);
    }

    pruneOldLogs();
  } catch {
    // Never crash request handling due to log rotation
  }
}

function scheduleMidnightRotation() {
  if (rotationScheduled) return;
  rotationScheduled = true;

  const arm = () => {
    const delay = msUntilNextWibMidnightPlus1s();
    const timer = setTimeout(() => {
      const prevKey = currentLogDateKey;
      currentLogDateKey = getWibDateKey();
      rotateLogIfNeeded(prevKey);
      arm();
    }, delay);
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  };

  arm();
}

/**
 * Writes a structured JSONL log entry to `logs/sisma.log` with automatic 00:00:01 WIB rotation.
 */
export function writeAppLog(entry: AppLogEntry) {
  try {
    scheduleMidnightRotation();
    const now = new Date();
    const todayKey = getWibDateKey(now);
    if (todayKey !== currentLogDateKey) {
      const prevKey = currentLogDateKey;
      currentLogDateKey = todayKey;
      rotateLogIfNeeded(prevKey);
    }

    ensureLogDir();
    const record: AppLogEntry = {
      ts: now.toISOString(),
      tsWib: formatWibTimestamp(now),
      ...entry,
    };
    fs.appendFileSync(ACTIVE_LOG_FILE, JSON.stringify(record) + '\n', 'utf8');
  } catch {
    // Never throw from logger
  }
}
