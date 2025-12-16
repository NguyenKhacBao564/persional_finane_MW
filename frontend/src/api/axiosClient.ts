import axios, { type InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, clearTokens } from '../lib/tokens';
import { refreshTokens } from './authRefresh';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint)) || url.includes('/health');
}

let isRefreshing = false;
const refreshWaiters: ((token: string | null) => void)[] = [];

export const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();
    if (accessToken && !isAuthEndpoint(config.url)) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshWaiters.push((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axiosClient(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshTokens();

        if (newAccessToken) {
          refreshWaiters.forEach((waiter) => waiter(newAccessToken));
          refreshWaiters.length = 0;

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosClient(originalRequest);
        } else {
          refreshWaiters.forEach((waiter) => waiter(null));
          refreshWaiters.length = 0;

          clearTokens();
          window.location.assign('/login');
          return Promise.reject(error);
        }
      } catch (refreshError) {
        refreshWaiters.forEach((waiter) => waiter(null));
        refreshWaiters.length = 0;

        clearTokens();
        window.location.assign('/login');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
