const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const ACCESS_TOKEN_KEY = 'wms_access_token';
const REFRESH_TOKEN_KEY = 'wms_refresh_token';

export function getAccessToken(): string | null {
  try { return localStorage.getItem(ACCESS_TOKEN_KEY); } catch { return null; }
}

export function getRefreshToken(): string | null {
  try { return localStorage.getItem(REFRESH_TOKEN_KEY); } catch { return null; }
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function decodeToken(token: string): { exp?: number } | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function isTokenExpired(token: string, bufferMs = 5 * 60 * 1000): boolean {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return Date.now() >= (decoded.exp * 1000 - bufferMs);
}

let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    if (json.success && json.data) {
      setTokens(json.data.accessToken, json.data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = attemptRefresh().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

let wasTokenSent = false;

export async function api<T = unknown>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {},
): Promise<T> {
  const { params, ...fetchOptions } = options;
  const url = new URL(`${API_BASE}/api${path}`);
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const headers = new Headers(fetchOptions.headers);
  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const accessToken = getAccessToken();
  wasTokenSent = false;

  if (accessToken) {
    if (isTokenExpired(accessToken)) {
      await refreshAccessToken();
      const refreshedToken = getAccessToken();
      if (refreshedToken) {
        headers.set('Authorization', `Bearer ${refreshedToken}`);
        wasTokenSent = true;
      }
    } else {
      headers.set('Authorization', `Bearer ${accessToken}`);
      wasTokenSent = true;
    }
  }

  let response = await fetch(url.toString(), { ...fetchOptions, headers });

  if (response.status === 401) {
    if (wasTokenSent) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const newToken = getAccessToken();
        if (newToken) {
          const retryHeaders = new Headers(headers);
          retryHeaders.set('Authorization', `Bearer ${newToken}`);
          response = await fetch(url.toString(), { ...fetchOptions, headers: retryHeaders });
        } else {
          clearTokens();
          throw new ApiError(401, 'Session expired. Please login again.');
        }
      } else {
        clearTokens();
        throw new ApiError(401, 'Session expired. Please login again.');
      }
    } else {
      throw new ApiError(401, 'Authentication required. Please login.');
    }
  }

  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(response.status, data.error || `Request failed with status ${response.status}`);
  }

  return (data.data ?? data) as T;
}

export default api;
