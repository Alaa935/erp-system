const API_BASE = import.meta.env.VITE_API_URL || 'https://server-e6y4.onrender.com';

const ACCESS_TOKEN_KEY = 'wms_access_token';
const REFRESH_TOKEN_KEY = 'wms_refresh_token';

export function getAccessToken(): string | null {
  const val = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!val) debugLog('getAccessToken -> null');
  return val;
}

export function getRefreshToken(): string | null {
  const val = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!val) debugLog('getRefreshToken -> null');
  return val;
}

let _debugId = 0;
function debugLog(...args: unknown[]) {
  console.log(`[API-CLIENT ${++_debugId}]`, ...args);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  debugLog('setTokens called', { accessToken: accessToken.slice(0, 20) + '...', refreshToken: refreshToken.slice(0, 20) + '...' });
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  debugLog('setTokens completed, verifying...', {
    readBack: localStorage.getItem(ACCESS_TOKEN_KEY)?.slice(0, 20) + '...',
    keys: Object.keys(localStorage),
  });
}

export function clearTokens(): void {
  const hadAccess = !!localStorage.getItem(ACCESS_TOKEN_KEY);
  const hadRefresh = !!localStorage.getItem(REFRESH_TOKEN_KEY);
  debugLog('clearTokens called', { hadAccess, hadRefresh, stack: new Error().stack?.split('\n').slice(2, 6).join(' | ') });
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  debugLog('clearTokens completed');
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
  debugLog('api() preparing request', { path, method: fetchOptions.method, hasToken: !!accessToken });

  if (accessToken) {
    if (isTokenExpired(accessToken)) {
      debugLog('api() access token expired, attempting refresh');
      await refreshAccessToken();
      const refreshedToken = getAccessToken();
      if (refreshedToken) {
        headers.set('Authorization', `Bearer ${refreshedToken}`);
        wasTokenSent = true;
        debugLog('api() token refreshed successfully, Authorization header set');
      } else {
        debugLog('api() refresh returned no new token');
      }
    } else {
      headers.set('Authorization', `Bearer ${accessToken}`);
      wasTokenSent = true;
      debugLog('api() access token valid, Authorization header set');
    }
  } else {
    debugLog('api() no access token, check refresh token fallback');
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      debugLog('api() attempting token refresh from getAccessToken=null fallback');
      await refreshAccessToken();
      const fallbackToken = getAccessToken();
      if (fallbackToken) {
        headers.set('Authorization', `Bearer ${fallbackToken}`);
        wasTokenSent = true;
        debugLog('api() fallback refresh succeeded, Authorization header set');
      }
    }
  }

  let response = await fetch(url.toString(), { ...fetchOptions, headers });
  debugLog('api() response', { status: response.status, path, wasTokenSent });

  if (response.status === 401) {
    if (wasTokenSent) {
      debugLog('api() got 401 with token, attempting refresh retry');
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const newToken = getAccessToken();
        if (newToken) {
          const retryHeaders = new Headers(headers);
          retryHeaders.set('Authorization', `Bearer ${newToken}`);
          debugLog('api() retrying request with refreshed token');
          response = await fetch(url.toString(), { ...fetchOptions, headers: retryHeaders });
          debugLog('api() retry response', { status: response.status, path });
        } else {
          clearTokens();
          window.location.href = '/login';
          throw new ApiError(401, 'Session expired. Please login again.');
        }
      } else {
        clearTokens();
        window.location.href = '/login';
        throw new ApiError(401, 'Session expired. Please login again.');
      }
    } else {
      debugLog('api() got 401 without token sent');
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const newToken = getAccessToken();
        if (newToken) {
          const retryHeaders = new Headers(headers);
          retryHeaders.set('Authorization', `Bearer ${newToken}`);
          debugLog('api() retrying request after no-token 401 refresh');
          response = await fetch(url.toString(), { ...fetchOptions, headers: retryHeaders });
          debugLog('api() retry response', { status: response.status, path });
        } else {
          clearTokens();
          window.location.href = '/login';
          throw new ApiError(401, 'Session expired. Please login again.');
        }
      } else {
        clearTokens();
        window.location.href = '/login';
        throw new ApiError(401, 'Authentication required. Please login.');
      }
    }
  }

  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(response.status, data.error || `Request failed with status ${response.status}`);
  }

  return (data.data !== undefined ? data.data : data) as T;
}

export default api;
