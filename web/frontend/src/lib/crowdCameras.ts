export type CameraStatus = 'online' | 'connecting' | 'offline' | 'error' | string;

export interface CrowdCamera {
  id: number;
  name: string;
  ip?: string | number | null;
  port?: number | string | null;
  protocol?: string;
  video_source?: string;
  status: CameraStatus;
  count?: number;
  density?: string | number;
  level?: string;
  fps?: number;
  zone_a?: number;
  zone_b?: number;
  added_at?: string;
  last_seen_at?: string;
  error?: string;
}

export interface CameraStats {
  count: number;
  density: string;
  zone_a: number;
  zone_b: number;
  fps: number;
  timestamp: string;
}

export type CameraCreatePayload =
  | { name: string; ip: '0'; port: 0; protocol: 'http' }
  | { name: string; video_path: string; ip: ''; port: 0; protocol: 'http' }
  | { name: string; ip: string; port: number; protocol: string };

async function json<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof body === 'object' && body && 'error' in body
        ? String((body as { error: unknown }).error)
        : `Request failed with ${res.status}`;
    throw new Error(message);
  }
  return body as T;
}

export const crowdCameraApi = {
  list: () =>
    fetch('/api/cameras', { cache: 'no-store' }).then((res) => json<CrowdCamera[]>(res)),

  create: (body: CameraCreatePayload) =>
    fetch('/api/cameras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((res) => json<{ success: boolean; camera: CrowdCamera }>(res)),

  remove: (cameraId: number) =>
    fetch(`/api/cameras/${cameraId}`, { method: 'DELETE' }).then((res) =>
      json<{ success: boolean }>(res)
    ),

  stats: (cameraId: number) =>
    fetch(`/api/cameras/${cameraId}/stats`, { cache: 'no-store' }).then((res) =>
      json<CameraStats>(res)
    ),

  frameUrl: (cameraId: number, tick = Date.now()) => `/api/cameras/${cameraId}/frame?t=${tick}`,

  heatmapUrl: (cameraId: number, tick = Date.now()) =>
    `/api/cameras/${cameraId}/heatmap?t=${tick}`,
};
