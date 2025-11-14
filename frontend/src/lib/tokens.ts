import { jwtDecode } from 'jwt-decode';

export const ACCESS_KEY = 'pfm_access';
export const REFRESH_KEY = 'pfm_refresh';

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

type DecodedToken = {
  exp: number;
  [key: string]: any;
};

const hasWindow = typeof window !== 'undefined';

export function setTokens(tokens: Tokens): void {
  if (!hasWindow) return;
  window.localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function getAccessToken(): string | null {
  if (!hasWindow) return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (!hasWindow) return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function clearTokens(): void {
  if (!hasWindow) return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

/**
 * Checks for existence of access/refresh tokens and validates the access
 * token is not expired.
 *
 * @returns boolean
 */
export function hasValidTokens(): boolean {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  if (!accessToken || !refreshToken) {
    return false;
  }

  try {
    const decoded = jwtDecode<DecodedToken>(accessToken);
    const hasExpired = decoded.exp * 1000 < Date.now();
    return !hasExpired;
  } catch (e) {
    // If token is malformed, treat as invalid
    return false;
  }
}
