import { axiosClient } from './axiosClient';

export interface Account {
  id: string;
  name: string;
  currency: string;
  userId?: string;
}

export async function fetchAccounts(): Promise<Account[]> {
  const response = await axiosClient.get<{
    success: boolean;
    data?: { accounts: Account[] };
    error?: { message?: string };
  }>('/accounts');

  if (!response.data?.success || !response.data.data) {
    throw new Error(
      response.data?.error?.message || 'Failed to fetch accounts'
    );
  }

  return response.data.data.accounts;
}

export async function createAccount(
  account: Omit<Account, 'id' | 'userId'>
): Promise<Account> {
  const response = await axiosClient.post<{
    success: boolean;
    data?: { account: Account };
    error?: { message?: string };
  }>('/accounts', account);

  if (!response.data?.success || !response.data.data) {
    throw new Error(
      response.data?.error?.message || 'Failed to create account'
    );
  }

  return response.data.data.account;
}
