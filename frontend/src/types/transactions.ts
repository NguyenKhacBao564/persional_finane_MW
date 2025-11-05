export type TxType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface TxCategory {
  id: string;
  name: string;
  color?: string;
}

export interface TxAccount {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  txDate: string;
  type: TxType;
  category?: TxCategory;
  note?: string;
  amount: number;
  currency: string;
  account?: TxAccount;
}

export interface TxListResponse {
  items: Transaction[];
  page: number;
  limit: number;
  total: number;
}

export interface TxFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: TxType;
  category?: string;
  min?: number;
  max?: number;
  start?: string;
  end?: string;
  sort?: string;
}
