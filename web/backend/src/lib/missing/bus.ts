/**
 * Lightweight Server-Sent Events hub for the missing-persons network.
 *
 * The dashboard subscribes to `GET /api/missing/stream`; mobile/web report and
 * sighting creation publish here so control-room operators get a real-time alert
 * the instant a citizen reports someone lost — no external socket server needed.
 */
import type { Response } from 'express';

type Client = { id: number; res: Response };

class MissingBus {
  private clients: Client[] = [];
  private nextId = 1;

  /** Register an SSE client. Returns an unsubscribe function. */
  subscribe(res: Response): () => void {
    const id = this.nextId++;
    this.clients.push({ id, res });

    // Open the stream.
    res.write(`event: connected\ndata: ${JSON.stringify({ id })}\n\n`);

    // Heartbeat so proxies don't close idle connections.
    const heartbeat = setInterval(() => {
      try {
        res.write(`event: ping\ndata: ${Date.now()}\n\n`);
      } catch {
        /* ignore */
      }
    }, 25000);

    return () => {
      clearInterval(heartbeat);
      this.clients = this.clients.filter((c) => c.id !== id);
    };
  }

  /** Broadcast an event to every connected dashboard client. */
  publish(type: string, data: unknown): void {
    const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients) {
      try {
        client.res.write(payload);
      } catch {
        /* drop on next gc */
      }
    }
  }

  get clientCount(): number {
    return this.clients.length;
  }
}

export const missingBus = new MissingBus();
