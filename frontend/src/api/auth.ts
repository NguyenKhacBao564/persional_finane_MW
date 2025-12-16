import { axiosClient } from './axiosClient';
import type { Tokens } from '../lib/tokens';

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
};

export type AuthResponse = {
  user: AuthUser;
  tokens: Tokens;
};

type RegisterPayload = { email: string; password: string; name?: string };
type LoginPayload = { email: string; password: string };

export async function register(payload: RegisterPayload) {
  const resp = await axiosClient.post('/auth/register', payload);
  // BE now returns { success, data: { user, tokens } }
  const { user, tokens } = resp.data?.data ?? {};
  if (!tokens?.accessToken || !tokens?.refreshToken) {
    // normalize server error to FE toast
    const msg =
      resp.data?.error?.message ||
      'Unexpected server response: missing tokens';
    throw new Error(msg);
  }
  return { user, tokens };
}

export async function login(payload: LoginPayload) {
  const resp = await axiosClient.post('/auth/login', payload);
  const { user, tokens } = resp.data?.data ?? {};
  if (!tokens?.accessToken || !tokens?.refreshToken) {
    const msg =
      resp.data?.error?.message ||
      'Unexpected server response: missing tokens';
    throw new Error(msg);
  }
  return { user, tokens };
}
