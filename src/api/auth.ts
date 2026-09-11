import { apiFetch, saveSession, clearSession } from './client';
import { AuthResponse } from '../types';

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password }
  });
  saveSession(data);
  return data;
}

export async function logoutApi(): Promise<void> {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch (e) {
    console.warn('Logout API warning:', e);
  } finally {
    clearSession();
  }
}
