// =============================================================================
// Access-token store
// -----------------------------------------------------------------------------
// The JWT access token is short-lived and kept in localStorage so the session
// survives a page reload. The refresh token is an httpOnly cookie managed by
// the backend and is never readable here. On a 401 the client silently uses
// the refresh cookie to mint a new access token (see client.ts).
// =============================================================================

const TOKEN_KEY = 'millance:auth:accessToken';

let inMemoryToken: string | null = null;

export function getToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  try {
    inMemoryToken = localStorage.getItem(TOKEN_KEY);
  } catch {
    inMemoryToken = null;
  }
  return inMemoryToken;
}

export function setToken(token: string): void {
  inMemoryToken = token;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable — keep the in-memory copy */
  }
}

export function clearToken(): void {
  inMemoryToken = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
