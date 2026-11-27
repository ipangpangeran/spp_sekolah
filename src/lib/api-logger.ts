import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/session';
import { writeAccessLog, writeAuditLog, writeErrorLog } from '@/lib/logger';

const SLOW_API_THRESHOLD_MS = 500;

export function getClientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

type RouteHandler = (request: Request, context?: any) => Promise<Response>;

/**
 * Wraps an API route handler to write separated:
 * - Access / Hit & latency logs -> `sisma_access.log`
 * - Backend user action audit logs -> `sisma_audit.log`
 * - Technical 5xx / uncaught error logs -> `sisma_error.log`
 */
export function withApiLogging(handler: RouteHandler, auditEventName?: string): RouteHandler {
  return async (request: Request, context?: any) => {
    const start = Date.now();
    const url = new URL(request.url);
    const method = request.method;
    const reqPath = url.pathname;
    const ip = getClientIp(request);
    const session = getSessionFromCookies();

    try {
      const response = await handler(request, context);
      const durationMs = Date.now() - start;
      const status = response.status;
      const slow = durationMs >= SLOW_API_THRESHOLD_MS;
      const event = auditEventName || `${method} ${reqPath}`;

      // 1. Always write hit & response time to sisma_access.log
      writeAccessLog({
        level: status >= 500 ? 'ERROR' : status >= 400 || slow ? 'WARN' : 'INFO',
        event,
        method,
        path: reqPath,
        status,
        durationMs,
        slow,
        userId: session?.id ?? null,
        username: session?.username ?? null,
        role: session?.level ?? null,
        ip,
      });

      // 2. Write user mutation / audit events to sisma_audit.log
      if (method !== 'GET' || auditEventName) {
        writeAuditLog({
          level: status >= 400 ? 'WARN' : 'INFO',
          event,
          method,
          path: reqPath,
          status,
          durationMs,
          userId: session?.id ?? null,
          username: session?.username ?? null,
          role: session?.level ?? null,
          ip,
        });
      }

      // 3. Write 5xx server errors to sisma_error.log
      if (status >= 500) {
        writeErrorLog({
          level: 'ERROR',
          source: 'backend',
          event,
          method,
          path: reqPath,
          status,
          durationMs,
          userId: session?.id ?? null,
          username: session?.username ?? null,
          role: session?.level ?? null,
          ip,
          error: `HTTP ${status} returned from ${method} ${reqPath}`,
        });
      }

      return response;
    } catch (err: any) {
      const durationMs = Date.now() - start;
      const event = auditEventName || `${method} ${reqPath}`;
      const errorMsg = err?.message || String(err);

      writeAccessLog({
        level: 'ERROR',
        event,
        method,
        path: reqPath,
        status: 500,
        durationMs,
        slow: durationMs >= SLOW_API_THRESHOLD_MS,
        userId: session?.id ?? null,
        username: session?.username ?? null,
        role: session?.level ?? null,
        ip,
      });

      writeErrorLog({
        level: 'ERROR',
        source: 'backend',
        event,
        method,
        path: reqPath,
        status: 500,
        durationMs,
        userId: session?.id ?? null,
        username: session?.username ?? null,
        role: session?.level ?? null,
        ip,
        error: errorMsg,
        stack: err?.stack,
      });

      return NextResponse.json({ error: errorMsg || 'Internal Server Error' }, { status: 500 });
    }
  };
}
