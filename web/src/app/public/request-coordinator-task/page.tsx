"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type EventOption = { id: string; name: string; location: string | null };
type CoordinatorOption = { id: number; name: string; avatar: string; zone: { name: string } | null };

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
      reset: (id: string) => void;
    };
  }
}

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

export default function PublicCoordinatorTaskPage() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const widgetHostRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnToken, setTurnToken] = useState("");

  const [events, setEvents] = useState<EventOption[]>([]);
  const [coordinators, setCoordinators] = useState<CoordinatorOption[]>([]);
  const [eventId, setEventId] = useState("");
  const [assignedToId, setAssignedToId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [publicCreatorName, setPublicCreatorName] = useState("");
  const [publicCreatorEmail, setPublicCreatorEmail] = useState("");
  const [notifyCreatorOnUpdates, setNotifyCreatorOnUpdates] = useState(false);
  const [websiteHp, setWebsiteHp] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ editUrl: string; editorToken: string } | null>(null);

  /** Edit existing (from link) */
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [editToken, setEditToken] = useState<string | null>(null);
  const [existingTask, setExistingTask] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const tid = params.get("taskId");
    const tok = params.get("token");
    if (tid && tok) {
      setEditTaskId(tid);
      setEditToken(tok);
    }
  }, []);

  const loadExistingTask = useCallback(async () => {
    if (!editTaskId || !editToken) return;
    setError(null);
    const res = await fetch(
      `/api/public/coordinator-tasks/${encodeURIComponent(editTaskId)}?token=${encodeURIComponent(editToken)}`
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Could not load task");
      return;
    }
    const t = data.task as Record<string, unknown>;
    setExistingTask(t);
    setTitle(String(t.title ?? ""));
    setDescription(String(t.description ?? ""));
    setPriority((t.priority as TaskPriority) || "MEDIUM");
  }, [editTaskId, editToken]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/public/coordinator-tasks/events");
      if (!res.ok) return;
      const j = await res.json();
      setEvents(j.data ?? []);
    })();
  }, []);

  useEffect(() => {
    if (!editTaskId || !editToken) return;
    void loadExistingTask();
  }, [editTaskId, editToken, loadExistingTask]);

  useEffect(() => {
    if (!eventId) {
      setCoordinators([]);
      setAssignedToId("");
      return;
    }
    void (async () => {
      const res = await fetch(
        `/api/public/coordinator-tasks/coordinators?eventId=${encodeURIComponent(eventId)}`
      );
      if (!res.ok) {
        setCoordinators([]);
        return;
      }
      const j = await res.json();
      setCoordinators(j.data ?? []);
      setAssignedToId("");
    })();
  }, [eventId]);

  const renderTurnstile = useCallback(() => {
    if (!siteKey || !widgetHostRef.current || !window.turnstile) return;
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        /* ignore */
      }
      widgetIdRef.current = null;
    }
    widgetIdRef.current = window.turnstile.render(widgetHostRef.current, {
      sitekey: siteKey,
      callback: (t: string) => setTurnToken(t),
      "error-callback": () => setTurnToken(""),
      "expired-callback": () => setTurnToken(""),
    });
  }, [siteKey]);

  useEffect(() => {
    if (!turnstileReady || !siteKey) return;
    renderTurnstile();
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
        widgetIdRef.current = null;
      }
    };
  }, [turnstileReady, siteKey, renderTurnstile, eventId, assignedToId]);

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (!siteKey && process.env.NODE_ENV === "production") {
        setError("This form is not configured.");
        return;
      }
      const res = await fetch("/api/public/coordinator-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          priority,
          eventId,
          assignedToId,
          publicCreatorName,
          publicCreatorEmail: publicCreatorEmail || undefined,
          notifyCreatorOnUpdates,
          turnstileToken: turnToken || "",
          website: websiteHp,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Submission failed");
        return;
      }
      setSuccess({ editUrl: data.editUrl, editorToken: data.editorToken });
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.reset(widgetIdRef.current);
      }
      setTurnToken("");
    } finally {
      setBusy(false);
    }
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTaskId || !editToken) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/public/coordinator-tasks/${encodeURIComponent(editTaskId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-task-editor-token": editToken,
        },
        body: JSON.stringify({ title, description, priority }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not save");
        return;
      }
      setExistingTask(data.task as Record<string, unknown>);
      setError(null);
    } finally {
      setBusy(false);
    }
  }

  if (editTaskId && editToken && existingTask) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-zinc-100">
        <h1 className="text-xl font-semibold">Update your task request</h1>
        <p className="mt-2 text-sm text-zinc-400">
          You can adjust the title, description, or priority. Coordinators handle status and assignment changes.
        </p>
        <form onSubmit={submitEdit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-300">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-300">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    );
  }

  if (editTaskId && editToken && !existingTask && !error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-zinc-400">
        Loading task…
      </div>
    );
  }

  if (editTaskId && editToken && error && !existingTask) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <>
      {siteKey ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
          onLoad={() => setTurnstileReady(true)}
        />
      ) : null}

      <div className="mx-auto max-w-lg px-4 py-10 text-zinc-100">
        <h1 className="text-xl font-semibold">Request coordinator assistance</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Submit a task without signing in. Your organization must enable public tasks on an event. Information is shared
          with the coordinator you select.
        </p>

        {success ? (
          <div className="mt-6 space-y-4 rounded-lg border border-emerald-700/50 bg-emerald-950/20 p-4">
            <p className="text-sm text-emerald-200">Submitted successfully.</p>
            <p className="text-xs text-zinc-400">
              Save this private link or token — for security we cannot show it again later.
            </p>
            <div>
              <p className="text-xs font-medium text-zinc-500">Editor token</p>
              <textarea
                readOnly
                className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 p-2 font-mono text-xs text-zinc-300"
                rows={3}
                value={success.editorToken}
              />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Edit link</p>
              <input
                readOnly
                className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 p-2 text-xs text-zinc-300"
                value={success.editUrl}
              />
            </div>
          </div>
        ) : (
          <form onSubmit={submitCreate} className="mt-6 space-y-4">
            <div className="hidden" aria-hidden>
              <label htmlFor="pub-company">Company</label>
              <input
                id="pub-company"
                tabIndex={-1}
                autoComplete="off"
                value={websiteHp}
                onChange={(e) => setWebsiteHp(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-300">Event</label>
              <select
                required
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
              >
                <option value="">Select event…</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                    {ev.location ? ` — ${ev.location}` : ""}
                  </option>
                ))}
              </select>
              {events.length === 0 ? (
                <p className="mt-1 text-xs text-amber-400/90">
                  No public events available yet. An admin must enable &quot;allow public tasks&quot; on an event.
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-300">Coordinator</label>
              <select
                required
                value={assignedToId === "" ? "" : assignedToId}
                onChange={(e) => setAssignedToId(e.target.value ? Number(e.target.value) : "")}
                disabled={!eventId}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 disabled:opacity-50"
              >
                <option value="">Select coordinator…</option>
                {coordinators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.zone?.name ? ` (${c.zone.name})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-300">Your name</label>
              <input
                required
                value={publicCreatorName}
                onChange={(e) => setPublicCreatorName(e.target.value)}
                maxLength={120}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-300">Email (optional)</label>
              <input
                type="email"
                value={publicCreatorEmail}
                onChange={(e) => setPublicCreatorEmail(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <input
                type="checkbox"
                checked={notifyCreatorOnUpdates}
                onChange={(e) => setNotifyCreatorOnUpdates(e.target.checked)}
              />
              Email me when the coordinator updates this task (requires email above)
            </label>

            <div>
              <label className="mb-1 block text-sm text-zinc-300">Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-300">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={2000}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-300">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {siteKey ? (
              <div>
                <div ref={widgetHostRef} className="min-h-[65px]" />
                {!turnToken ? (
                  <p className="mt-1 text-xs text-zinc-500">Complete the security check to enable submit.</p>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-amber-400">
                Development mode: CAPTCHA skipped when TURNSTILE_SECRET_KEY is unset.
              </p>
            )}

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <button
              type="submit"
              disabled={busy || (!!siteKey && !turnToken)}
              className="w-full rounded-md bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {busy ? "Submitting…" : "Submit request"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
