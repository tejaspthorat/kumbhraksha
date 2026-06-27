"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.missingBus = void 0;
class MissingBus {
    clients = [];
    nextId = 1;
    /** Register an SSE client. Returns an unsubscribe function. */
    subscribe(res) {
        const id = this.nextId++;
        this.clients.push({ id, res });
        // Open the stream.
        res.write(`event: connected\ndata: ${JSON.stringify({ id })}\n\n`);
        // Heartbeat so proxies don't close idle connections.
        const heartbeat = setInterval(() => {
            try {
                res.write(`event: ping\ndata: ${Date.now()}\n\n`);
            }
            catch {
                /* ignore */
            }
        }, 25000);
        return () => {
            clearInterval(heartbeat);
            this.clients = this.clients.filter((c) => c.id !== id);
        };
    }
    /** Broadcast an event to every connected dashboard client. */
    publish(type, data) {
        const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
        for (const client of this.clients) {
            try {
                client.res.write(payload);
            }
            catch {
                /* drop on next gc */
            }
        }
    }
    get clientCount() {
        return this.clients.length;
    }
}
exports.missingBus = new MissingBus();
