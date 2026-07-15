/**
 * Minimal typed fetch wrapper for the NyayAI API.
 *
 * The original project generated a full API client via Orval from an
 * OpenAPI spec (api-spec -> api-zod -> api-client-react). That pipeline made
 * sense for a larger, evolving API surface, but for the handful of endpoints
 * this app actually has, a hand-written ~30-line wrapper is easier to read,
 * easier to debug, and has zero codegen step to keep in sync.
 *
 * Requests use relative `/api/...` paths, which Vite proxies to the backend
 * in dev (see vite.config.ts) and which a reverse proxy / static host should
 * route to the API in production.
 */

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // Response wasn't JSON; keep the generic message.
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
