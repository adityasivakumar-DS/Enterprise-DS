import "dotenv/config";
import { AsyncLocalStorage } from "node:async_hooks";

const BASE_URL = process.env.LORALOOP_API_URL ?? "http://localhost:3000";

// ── Per-request token threading (used by HTTP/OAuth mode) ─────────────────
const tokenStorage = new AsyncLocalStorage<string>();

export function withToken<T>(token: string, fn: () => Promise<T>): Promise<T> {
  return tokenStorage.run(token, fn);
}

// ── Global token cache (used by stdio / env-var mode) ─────────────────────
let _globalToken: string | null = process.env.LORALOOP_JWT_TOKEN ?? null;
let _globalTokenExpiry: number | null = null;

async function refreshGlobalToken(): Promise<string> {
  const apiKey = process.env.LORALOOP_API_KEY;
  const email = process.env.LORALOOP_EMAIL;
  const password = process.env.LORALOOP_PASSWORD;

  if (apiKey) { _globalToken = apiKey; return apiKey; }
  if (!email || !password) {
    throw new Error(
      "Set LORALOOP_JWT_TOKEN, LORALOOP_API_KEY, or LORALOOP_EMAIL + LORALOOP_PASSWORD in .env"
    );
  }

  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) throw new Error(`Loraloop auth failed (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as { accessToken: string; expiresIn?: number };
  _globalToken = data.accessToken;
  _globalTokenExpiry = Date.now() + ((data.expiresIn ?? 900) - 60) * 1000;
  return _globalToken;
}

async function resolveToken(): Promise<string> {
  // Per-request token (OAuth/HTTP mode) takes priority
  const requestToken = tokenStorage.getStore();
  if (requestToken) return requestToken;

  // Fall back to global env-var token (stdio mode)
  if (_globalToken && (!_globalTokenExpiry || Date.now() < _globalTokenExpiry)) {
    return _globalToken;
  }
  return refreshGlobalToken();
}

// ── API client ────────────────────────────────────────────────────────────
export type ApiMethod = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";

export async function api<T = unknown>(
  path: string,
  method: ApiMethod = "GET",
  body?: unknown,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const token = await resolveToken();

  let url = `${BASE_URL}${path}`;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Loraloop API ${method} ${path} failed (${res.status}): ${err}`);
  }
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

export function fmt(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function getBaseUrl(): string {
  return BASE_URL;
}
