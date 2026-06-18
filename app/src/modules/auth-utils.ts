/**
 * JWT auth utilities for frontend token validation and cleanup.
 * Decodes JWT payload via base64 (no secret needed) to check expiry.
 */

export const AUTH_STORAGE_KEYS = [
  'token',
  'userId',
  'displayName',
  'surName',
  'givenName',
  'isAdmin',
  'tokenExpiration',
];

export function clearAuthStorage (): void {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function getTokenExp (token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

export function isTokenExpired (token: string): boolean {
  const exp = getTokenExp(token);
  if (exp === null) return true;
  return Date.now() >= exp * 1000;
}

export function forceLogout (): void {
  clearAuthStorage();
  window.location.href = '/nm';
}
