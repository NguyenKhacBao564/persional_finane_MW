import { axiosClient } from './axiosClient';
import type { TxFilters, TxListResponse, Transaction } from '@/types/transactions';
import type {
  TransactionCreateInput,
  TransactionUpdateInput,
} from '@/schemas/transaction';

/**
 * Fetch paginated list of transactions with filters.
 */
export async function fetchTransactions(params: TxFilters): Promise<TxListResponse> {
  try {
    const response = await axiosClient.get('/api/transactions', { params });

    if (response.data?.success === false) {
      throw new Error(response.data?.error?.message || 'Failed to fetch transactions');
    }

    return response.data.data;
  } catch (error: any) {
    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }
    throw new Error(error.message || 'Failed to fetch transactions');
  }
}

/**
 * Create a new transaction.
 * @param input - Transaction creation data
 * @returns Created transaction
 */
export async function createTransaction(
  input: TransactionCreateInput
): Promise<Transaction> {
  try {
    const response = await axiosClient.post('/api/transactions', input);

    if (response.data?.success === false) {
      throw new Error(
        response.data?.error?.message || 'Failed to create transaction'
      );
    }

    return response.data.data as Transaction;
  } catch (error: any) {
    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }
    throw new Error(error.message || 'Failed to create transaction');
  }
}

/**
 * Update an existing transaction.
 * @param id - Transaction ID
 * @param input - Transaction update data
 * @returns Updated transaction
 */
export async function updateTransaction(
  id: string,
  input: Omit<TransactionUpdateInput, 'id'>
): Promise<Transaction> {
  try {
    const response = await axiosClient.patch(`/api/transactions/${id}`, input);

    if (response.data?.success === false) {
      throw new Error(
        response.data?.error?.message || 'Failed to update transaction'
      );
    }

    return response.data.data as Transaction;
  } catch (error: any) {
    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }
    throw new Error(error.message || 'Failed to update transaction');
  }
}
