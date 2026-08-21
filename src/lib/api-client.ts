const API_BASE = import.meta.env.VITE_API_URL || 'https://server-e6y4.onrender.com';

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
    const parts = token.split('.');
    const payload = parts[1];
    if (!payload) return null;
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function isTokenExpired(token: string, bufferMs = 30 * 1000): boolean {
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
  options: RequestInit & { params?: Record<string, string | number | boolean | undefined | null> } = {},
): Promise<T> {
  const { params, ...fetchOptions } = options;
  const url = new URL(`${API_BASE}/api${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && String(v) !== 'undefined') {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const headers = new Headers(fetchOptions.headers);
  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let accessToken = getAccessToken();
  wasTokenSent = false;

  if (accessToken && isTokenExpired(accessToken)) {
    await refreshAccessToken();
    accessToken = getAccessToken();
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
    wasTokenSent = true;
  }


  console.log('[api-client] REQUEST URL:', url.toString());
  console.log('[api-client] REQUEST METHOD:', fetchOptions.method || 'GET');
  console.log('[api-client] REQUEST PARAMS:', params);

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
  console.log('[api-client] RESPONSE STATUS:', response.status);
  console.log('[api-client] RAW RESPONSE BODY:', data);

  if (!response.ok) {
    throw new ApiError(response.status, data.error || `Request failed with status ${response.status}`);
  }

  const result = data as T;
  console.log('[api-client] RETURN VALUE:', result);
  return result;
}

export default api;
