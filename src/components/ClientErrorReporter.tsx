'use client';

import { useEffect } from 'react';

export default function ClientErrorReporter() {
  useEffect(() => {
    let lastSentAt = 0;

    const sendError = (payload: { type: string; message: string; stack?: string }) => {
      const now = Date.now();
      if (now - lastSentAt < 2000) return; // Prevent error-loop flooding
      lastSentAt = now;

      const body = JSON.stringify({
        ...payload,
        url: window.location.pathname + window.location.search,
      });

      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([body], { type: 'application/json' });
          navigator.sendBeacon('/api/client-error', blob);
        } else {
          fetch('/api/client-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        // Ignore reporting failures
      }
    };

    const onError = (event: ErrorEvent) => {
      sendError({
        type: 'FRONTEND_UNCAUGHT_ERROR',
        message: event.message || 'Uncaught window error',
        stack: event.error?.stack || `${event.filename || ''}:${event.lineno || 0}:${event.colno || 0}`,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      sendError({
        type: 'FRONTEND_UNHANDLED_REJECTION',
        message: reason?.message || String(reason || 'Unhandled promise rejection'),
        stack: reason?.stack,
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
