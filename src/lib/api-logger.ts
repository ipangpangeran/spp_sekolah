import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/session';
import { writeAppLog } from '@/lib/logger';

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
 * Wraps a Next.js App Router API handler with audit trail, error capture, and latency logging.
 */
export function withApiLogging(handler: RouteHandler, eventName?: string): RouteHandler {
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

      // Log all mutations, slow requests, auth events, or errors (>= 400)
      if (method !== 'GET' || status >= 400 || slow || eventName) {
        writeAppLog({
          level: status >= 500 ? 'ERROR' : status >= 400 || slow ? 'WARN' : 'INFO',
          event: eventName || `${method} ${reqPath}`,
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
      }

      return response;
    } catch (err: any) {
      const durationMs = Date.now() - start;
      writeAppLog({
        level: 'ERROR',
        event: eventName || `${method} ${reqPath}`,
        method,
        path: reqPath,
        status: 500,
        durationMs,
        slow: durationMs >= SLOW_API_THRESHOLD_MS,
        userId: session?.id ?? null,
        username: session?.username ?? null,
        role: session?.level ?? null,
        ip,
        error: err?.stack || err?.message || String(err),
      });
      return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
    }
  };
}
