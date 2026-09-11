import { AuthResponse } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://solve.ivy.homes').replace(/\/$/, '');
const API_KEY = import.meta.env.VITE_API_KEY || 'IVY26-05FB73DA5767';

// Token Storage Keys
const ACCESS_TOKEN_KEY = 'ivy_access_token';
const REFRESH_TOKEN_KEY = 'ivy_refresh_token';
const USER_KEY = 'ivy_user';
const TOKEN_EXPIRY_KEY = 'ivy_token_expiry';

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): any | null {
  const u = localStorage.getItem(USER_KEY);
  return u ? JSON.parse(u) : null;
}

export function saveSession(auth: AuthResponse): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, auth.access_token);
  if (auth.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, auth.refresh_token);
  }
  if (auth.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
  }
  // Store expiry time (expires_in seconds from now)
  const expiry = Date.now() + (auth.expires_in || 900) * 1000;
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

export async function refreshAuthToken(): Promise<string | null> {
  const refresh = getStoredRefreshToken();
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({ refresh_token: refresh })
    });

    if (!res.ok) {
      clearSession();
      return null;
    }

    const data: AuthResponse = await res.json();
    saveSession(data);
    return data.access_token;
  } catch (err) {
    console.error('Token refresh failed:', err);
    clearSession();
    return null;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: { method?: string; body?: any; params?: Record<string, any> } = {}
): Promise<T> {
  let token = getStoredAccessToken();
  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);

  // Auto refresh if within 1 minute of expiration
  if (expiryStr && Date.now() > parseInt(expiryStr, 10) - 60000) {
    const newToken = await refreshAuthToken();
    if (newToken) token = newToken;
  }

  let url = `${API_BASE_URL}${endpoint}`;
  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const headers: Record<string, string> = {
    'X-API-Key': API_KEY
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let bodyData: string | undefined = undefined;
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    bodyData = JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: bodyData
  });

  if (response.status === 401 && token) {
    // Attempt token refresh on 401 once
    const newToken = await refreshAuthToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryResponse = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: bodyData
      });
      if (!retryResponse.ok) {
        const errText = await retryResponse.text();
        throw new Error(`API Error ${retryResponse.status}: ${errText}`);
      }
      return retryResponse.json();
    } else {
      clearSession();
      window.dispatchEvent(new Event('auth:unauthorized'));
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (!response.ok) {
    const errorBody = await response.text();
    let message = `API Error ${response.status}`;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.detail) message = parsed.detail;
    } catch {}
    throw new Error(message);
  }

  return response.json();
}
