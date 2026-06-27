const base = () =>
  process.env.NEXT_PUBLIC_COORDINATOR_API_URL ?? "http://localhost:3001/api/v1";

export function getCoordinatorAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("coordinator_access_token");
}

export function setCoordinatorTokens(access: string, refresh: string) {
  sessionStorage.setItem("coordinator_access_token", access);
  sessionStorage.setItem("coordinator_refresh_token", refresh);
}

export function clearCoordinatorTokens() {
  sessionStorage.removeItem("coordinator_access_token");
  sessionStorage.removeItem("coordinator_refresh_token");
}

export async function coordinatorFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getCoordinatorAccessToken();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${base()}${path}`, { ...init, headers });
}
