'use server';

import { revalidatePath } from 'next/cache';

/**
 * Task actions now delegate to the centralized Express backend (single source of
 * truth). These thin wrappers preserve the original signatures/return shapes so
 * call sites stay unchanged; the StaffTask + alert business logic lives in the
 * backend at /api/staff-tasks.
 */
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

// Auth removed — backend runs as the shared "Control Room" identity.
const CONTROL_ROOM_ID = 'control-room';

async function backend(path: string, init: RequestInit & { method: string }) {
  const res = await fetch(`${BACKEND_URL}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': CONTROL_ROOM_ID,
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON / empty response
  }

  if (!res.ok) {
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return body;
}

export async function assignTask(data: {
  text: string;
  assignee: string;
  staffId: number;
  priority: 'low' | 'medium' | 'high';
  time: string;
}) {
  const body = await backend('/staff-tasks', { method: 'POST', body: JSON.stringify(data) });
  revalidatePath('/dashboard/staff');
  return { success: true, data: body?.data };
}

export async function deleteTask(id: number) {
  await backend(`/staff-tasks/${id}`, { method: 'DELETE' });
  revalidatePath('/dashboard/staff');
  return { success: true };
}
