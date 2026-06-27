'use server';

import { revalidatePath } from 'next/cache';

/**
 * Staff actions now delegate to the centralized Express backend (single source of
 * truth). These thin wrappers preserve the original signatures/return shapes so
 * call sites stay unchanged; all business logic (password generation, profile
 * provisioning, welcome email) lives in the backend.
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

export async function createStaff(data: {
  email: string;
  name: string;
  role: string;
  staffRole?: string;
  zoneId: number;
  avatar: string;
}) {
  await backend('/staff', { method: 'POST', body: JSON.stringify(data) });
  revalidatePath('/dashboard/staff');
  return { success: true };
}

export async function updateStaff(id: number, data: any) {
  await backend(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  revalidatePath('/dashboard/staff');
  return { success: true };
}

export async function deleteStaff(id: number) {
  await backend(`/staff/${id}`, { method: 'DELETE' });
  revalidatePath('/dashboard/staff');
  return { success: true };
}
