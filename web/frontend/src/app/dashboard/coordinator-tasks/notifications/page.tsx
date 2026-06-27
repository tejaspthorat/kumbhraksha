"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { coordinatorFetch } from "@/lib/coordinatorApi";

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  type: string;
};

export default function CoordinatorNotificationsPage() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await coordinatorFetch("/notifications?limit=50");
    if (!res.ok) {
      setError("Failed to load notifications");
      return;
    }
    const json = await res.json();
    setItems(json.data ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(ids: string[]) {
    await coordinatorFetch("/notifications/read", {
      method: "PATCH",
      body: JSON.stringify({ ids }),
    });
    void load();
  }

  return (
    <div className="space-y-6 px-4 py-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-ink">Notifications</h1>
        <Link href="/dashboard/coordinator-tasks" className="text-sm link-coral hover:underline">
          Tasks
        </Link>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <ul className="space-y-2">
        {items.length === 0 ? (
          <li className="text-muted-soft">No notifications.</li>
        ) : (
          items.map((n) => (
            <li
              key={n.id}
              className={`flex flex-col gap-1 rounded-lg border px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${
                n.read ? "border-hairline bg-surface-soft" : "border-coral/30 bg-coral/5"
              }`}
            >
              <div>
                <p className="font-medium text-ink">{n.title}</p>
                <p className="text-sm text-muted">{n.body}</p>
                <p className="text-xs text-muted-soft">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              {!n.read ? (
                <button
                  type="button"
                  onClick={() => markRead([n.id])}
                  className="mt-2 shrink-0 rounded border border-hairline px-2 py-1 text-xs text-body hover:bg-surface-card sm:mt-0"
                >
                  Mark read
                </button>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
