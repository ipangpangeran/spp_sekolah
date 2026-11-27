import fs from 'node:fs';
import path from 'node:path';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';
export type LogChannel = 'audit' | 'access' | 'error';

export interface BaseLogEntry {
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
  source?: 'backend' | 'frontend';
  detail?: Record<string, unknown>;
  error?: string;
  stack?: string;
}

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
const MAX_RETENTION_DAYS = 30;

const CHANNELS: Record<LogChannel, { active: string; prefix: string }> = {
  audit: { active: 'sisma_audit.log', prefix: 'sisma_audit_' },
  access: { active: 'sisma_access.log', prefix: 'sisma_access_' },
  error: { active: 'sisma_error.log', prefix: 'sisma_error_' },
};

function getWibCompactDateKey(date = new Date()): string {
  const wib = new Date(date.getTime() + WIB_OFFSET_MS);
  const y = wib.getUTCFullYear();
  const m = String(wib.getUTCMonth() + 1).padStart(2, '0');
  const d = String(wib.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
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
      if (!/^sisma_(audit|access|error)_\d{8}\.log$/.test(file)) continue;
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

let currentLogDateKey = getWibCompactDateKey();
let rotationScheduled = false;

/**
 * Rotates a single channel file: `sisma_<channel>.log` -> `sisma_<channel>_YYYYMMDD.log`.
 */
export function rotateChannelIfNeeded(channel: LogChannel, targetArchiveDate?: string) {
  try {
    ensureLogDir();
    const cfg = CHANNELS[channel];
    const activePath = path.join(LOG_DIR, cfg.active);
    if (!fs.existsSync(activePath)) return;
    const stat = fs.statSync(activePath);
    if (stat.size === 0) return;

    const archiveKey = targetArchiveDate || getWibCompactDateKey(stat.mtime);
    const rotatedPath = path.join(LOG_DIR, `${cfg.prefix}${archiveKey}.log`);

    if (fs.existsSync(rotatedPath)) {
      const existingContent = fs.readFileSync(activePath);
      fs.appendFileSync(rotatedPath, existingContent);
      fs.truncateSync(activePath, 0);
    } else {
      fs.renameSync(activePath, rotatedPath);
    }
  } catch {
    // Never crash request handling due to log rotation
  }
}

/**
 * Rotates all 3 channels (`audit`, `access`, `error`) and prunes old archives.
 */
export function rotateAllChannels(targetArchiveDate?: string) {
  rotateChannelIfNeeded('audit', targetArchiveDate);
  rotateChannelIfNeeded('access', targetArchiveDate);
  rotateChannelIfNeeded('error', targetArchiveDate);
  pruneOldLogs();
}

function scheduleMidnightRotation() {
  if (rotationScheduled) return;
  rotationScheduled = true;

  const arm = () => {
    const delay = msUntilNextWibMidnightPlus1s();
    const timer = setTimeout(() => {
      const prevKey = currentLogDateKey;
      currentLogDateKey = getWibCompactDateKey();
      rotateAllChannels(prevKey);
      arm();
    }, delay);
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  };

  arm();
}

function writeToChannel(channel: LogChannel, entry: BaseLogEntry) {
  try {
    scheduleMidnightRotation();
    const now = new Date();
    const todayKey = getWibCompactDateKey(now);
    if (todayKey !== currentLogDateKey) {
      const prevKey = currentLogDateKey;
      currentLogDateKey = todayKey;
      rotateAllChannels(prevKey);
    }

    ensureLogDir();
    const activePath = path.join(LOG_DIR, CHANNELS[channel].active);
    const record: BaseLogEntry = {
      ts: now.toISOString(),
      tsWib: formatWibTimestamp(now),
      ...entry,
    };
    fs.appendFileSync(activePath, JSON.stringify(record) + '\n', 'utf8');
  } catch {
    // Never throw from logger
  }
}

export function writeAuditLog(entry: BaseLogEntry) {
  writeToChannel('audit', entry);
}

export function writeAccessLog(entry: BaseLogEntry) {
  writeToChannel('access', entry);
}

export function writeErrorLog(entry: BaseLogEntry) {
  writeToChannel('error', entry);
}
