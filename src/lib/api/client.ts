// =============================================================================
// HTTP API Client
// -----------------------------------------------------------------------------
// The single seam between the frontend services and the real backend REST API.
// Responsibilities:
//   • Prefix all requests with the configured API base URL.
//   • Attach the JWT access token as a Bearer header.
//   • Send credentials (httpOnly refresh cookie) on every request.
//   • Unwrap the backend response envelope { success, data, message }.
//   • Transparently refresh the access token once on a 401, then retry.
//   • Surface backend validation errors as thrown Error instances.
//
// Services import { api } and call api.get/post/patch/del — they never touch
// fetch, tokens, or the envelope directly.
// =============================================================================

import { getToken, setToken, clearToken } from './token';

// Vite exposes env vars prefixed with VITE_. Fallback to the local backend.
const BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:5000/api/v1';

// ── Response envelope ────────────────────────────────────────────────────────
interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
  // Backend pagination metadata (present on list endpoints)
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

export interface Paginated<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly errors?: Array<{ field: string; message: string }>;
  constructor(message: string, status: number, errors?: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

// ── Query-string builder ─────────────────────────────────────────────────────
export type QueryParams = Record<string, string | number | boolean | undefined | null>;

function buildQuery(params?: QueryParams): string {
  if (!params) return '';
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      usp.append(key, String(value));
    }
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

// ── Refresh handling (single-flight so concurrent 401s share one refresh) ─────
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) return false;
        const body = (await res.json()) as ApiEnvelope<{ accessToken: string }>;
        if (body.success && body.data?.accessToken) {
          setToken(body.data.accessToken);
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        // Reset after the in-flight refresh settles so the next 401 can retry.
        setTimeout(() => { refreshPromise = null; }, 0);
      }
    })();
  }
  return refreshPromise;
}

// ── Core request ─────────────────────────────────────────────────────────────
interface RequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: QueryParams;
  /** Internal flag: prevents infinite refresh loops. */
  _retry?: boolean;
  /** Skip attaching the Authorization header (used by login/refresh). */
  skipAuth?: boolean;
}

async function request<T>(path: string, opts: RequestOptions): Promise<{ data: T; envelope: ApiEnvelope<T> }> {
  const url = `${BASE_URL}${path}${buildQuery(opts.query)}`;

  const headers: Record<string, string> = {};
  const token = getToken();
  if (token && !opts.skipAuth) headers['Authorization'] = `Bearer ${token}`;

  const isFormData = typeof FormData !== 'undefined' && opts.body instanceof FormData;
  let payload: BodyInit | undefined;
  if (opts.body !== undefined) {
    if (isFormData) {
      payload = opts.body as FormData;
    } else {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(opts.body);
    }
  }

  const res = await fetch(url, {
    method: opts.method,
    headers,
    body: payload,
    credentials: 'include',
  });

  // Attempt a one-time transparent refresh on 401 (expired access token).
  if (res.status === 401 && !opts._retry && !opts.skipAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request<T>(path, { ...opts, _retry: true });
    }
    // Refresh failed — the session is dead. Clear it so guards redirect to login.
    clearToken();
  }

  // 204 No Content
  if (res.status === 204) {
    return { data: undefined as unknown as T, envelope: { success: true } };
  }

  let envelope: ApiEnvelope<T>;
  try {
    envelope = (await res.json()) as ApiEnvelope<T>;
  } catch {
    if (!res.ok) throw new ApiError(res.statusText || 'Request failed', res.status);
    // Non-JSON success body — return raw text as data.
    return { data: undefined as unknown as T, envelope: { success: true } };
  }

  if (!res.ok || envelope.success === false) {
    const msg = envelope.message || res.statusText || 'Request failed';
    throw new ApiError(msg, res.status, envelope.errors);
  }

  return { data: envelope.data as T, envelope };
}

// ── Public helpers ───────────────────────────────────────────────────────────
export const api = {
  async get<T>(path: string, query?: QueryParams): Promise<T> {
    const { data } = await request<T>(path, { method: 'GET', query });
    return data;
  },

  /** GET a list endpoint and return both items and pagination metadata. */
  async getPaginated<T>(path: string, query?: QueryParams): Promise<Paginated<T>> {
    const { data, envelope } = await request<T[]>(path, { method: 'GET', query });
    return {
      items: data ?? [],
      pagination: envelope.pagination ?? {
        page: 1,
        limit: (data ?? []).length,
        total: (data ?? []).length,
        totalPages: 1,
      },
    };
  },

  async post<T>(path: string, body?: unknown, opts?: { skipAuth?: boolean; query?: QueryParams }): Promise<T> {
    const { data } = await request<T>(path, {
      method: 'POST',
      body,
      skipAuth: opts?.skipAuth,
      query: opts?.query,
    });
    return data;
  },

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const { data } = await request<T>(path, { method: 'PATCH', body });
    return data;
  },

  async put<T>(path: string, body?: unknown, query?: QueryParams): Promise<T> {
    const { data } = await request<T>(path, { method: 'PUT', body, query });
    return data;
  },

  async del<T>(path: string, body?: unknown): Promise<T> {
    const { data } = await request<T>(path, { method: 'DELETE', body });
    return data;
  },
};

export { BASE_URL };
