const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Returns current date parts in GMT+7 (Asia/Jakarta).
 */
export function getWibNowParts(now = new Date()) {
  const wib = new Date(now.getTime() + WIB_OFFSET_MS);
  return {
    year: wib.getUTCFullYear(),
    month: wib.getUTCMonth() + 1,
    day: wib.getUTCDate(),
  };
}

/**
 * Returns YYYYMMDD string in GMT+7 (Asia/Jakarta) for receipt reference numbers.
 */
export function getWibDateStr(now = new Date()): string {
  const { year, month, day } = getWibNowParts(now);
  return `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
}

/**
 * Returns a Date representing 00:00:00.000 GMT+7 (Asia/Jakarta) for today (or offset days).
 */
export function getWibStartOfDay(offsetDays = 0, now = new Date()): Date {
  const { year, month, day } = getWibNowParts(now);
  const utcMidnightWib = Date.UTC(year, month - 1, day + offsetDays, 0, 0, 0, 0) - WIB_OFFSET_MS;
  return new Date(utcMidnightWib);
}

/**
 * Builds a GMT+7 date range for dashboard filtering.
 */
export function buildWibDateRange(
  period: string,
  startDateParam: string | null,
  endDateParam: string | null
): { gte?: Date; lte?: Date } | undefined {
  const startOfToday = getWibStartOfDay(0);

  if (period === 'today') {
    return { gte: startOfToday, lte: new Date(startOfToday.getTime() + 86400000 - 1) };
  }
  if (period === '7d') {
    return { gte: getWibStartOfDay(-6) };
  }
  if (period === '30d') {
    return { gte: getWibStartOfDay(-29) };
  }
  if (period === 'month') {
    const { year, month } = getWibNowParts();
    const firstOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0) - WIB_OFFSET_MS);
    return { gte: firstOfMonth };
  }
  if (period === 'custom' && (startDateParam || endDateParam)) {
    const range: { gte?: Date; lte?: Date } = {};
    if (startDateParam) {
      const s = new Date(`${startDateParam}T00:00:00+07:00`);
      if (!Number.isNaN(s.getTime())) range.gte = s;
    }
    if (endDateParam) {
      const e = new Date(`${endDateParam}T23:59:59.999+07:00`);
      if (!Number.isNaN(e.getTime())) range.lte = e;
    }
    return Object.keys(range).length > 0 ? range : undefined;
  }
  return undefined;
}
