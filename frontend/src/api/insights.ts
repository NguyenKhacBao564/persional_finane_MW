import { axiosClient } from './axiosClient';

export interface SpendingByCategoryItem {
  categoryId: string;
  categoryName: string;
  categoryColor?: string;
  totalAmount: number;
  currency: string;
  percentage: number;
  [key: string]: any;
}

export interface SpendingByCategoryResponse {
  items: SpendingByCategoryItem[];
  total: number;
  currency: string;
}

export interface TrendItem {
  date: string;
  income: number;
  expense: number;
  [key: string]: any;
}

export interface TrendsResponse {
  items: TrendItem[];
}

export interface InsightsParams {
  from?: string;
  to?: string;
  groupBy?: 'day' | 'month';
}

// export const fetchSpendingByCategory = async (params?: InsightsParams) => {
//   const response = await axiosClient.get<SpendingByCategoryResponse>('/insights/spending-by-category', { params });
//   return response.data;
// };

// export const fetchTrends = async (params?: InsightsParams) => {
//   const response = await axiosClient.get<TrendsResponse>('/insights/trends', { params });
//   return response.data;
// };

export const fetchSpendingByCategory = async (params?: InsightsParams) => {
  // SỬA: Map 'from' -> 'start', 'to' -> 'end'
  const queryParams = {
    start: params?.from,
    end: params?.to,
    ...params
  };
  const response = await axiosClient.get<any>('/insights/spending-by-category', { params: queryParams });
  // Map backend response { data: { spending: [...] } } to { items: [...] }
  return {
    items: response.data.data.spending,
    total: response.data.data.spending.reduce((acc: number, item: any) => acc + item.totalAmount, 0),
    currency: 'VND' // Default or from API
  } as SpendingByCategoryResponse;
};

export const fetchTrends = async (params?: InsightsParams) => {
  // SỬA: Map 'from' -> 'start', 'to' -> 'end'
  const queryParams = {
    start: params?.from,
    end: params?.to,
    interval: params?.groupBy // Lưu ý: Backend dùng 'interval', Frontend dùng 'groupBy'
  };
  const response = await axiosClient.get<any>('/insights/trends', { params: queryParams });
  // Map backend response { data: { trends: [...] } } to { items: [...] }
  return {
    items: response.data.data.trends
  } as TrendsResponse;
};
