'use client';

import { useEffect, useRef } from 'react';
import type { MissingReport, Sighting } from './types';

/**
 * Subscribes to the backend Server-Sent Events stream so the control room gets a
 * real-time alert the moment a citizen reports someone missing from the mobile
 * app. Reconnects automatically; safe to call once per page.
 */
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

export function useMissingStream(handlers: {
  onReport?: (report: MissingReport & { source?: string }) => void;
  onSighting?: (sighting: Sighting) => void;
  onStatus?: (connected: boolean) => void;
}) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    let es: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const connect = () => {
      if (closed) return;
      es = new EventSource(`${BACKEND_URL}/api/missing/stream`);

      es.addEventListener('connected', () => ref.current.onStatus?.(true));

      es.addEventListener('report:new', (e) => {
        try {
          ref.current.onReport?.(JSON.parse((e as MessageEvent).data));
        } catch {
          /* ignore malformed */
        }
      });

      es.addEventListener('sighting:new', (e) => {
        try {
          ref.current.onSighting?.(JSON.parse((e as MessageEvent).data));
        } catch {
          /* ignore malformed */
        }
      });

      es.onerror = () => {
        ref.current.onStatus?.(false);
        es?.close();
        if (!closed) retry = setTimeout(connect, 4000);
      };
    };

    connect();

    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      es?.close();
    };
  }, []);
}
