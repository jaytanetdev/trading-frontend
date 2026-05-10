import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { v4 as uuidv4 } from 'uuid';

function resolveApiUrl(raw: string | undefined): string {
  const url = raw ?? 'http://localhost:3001';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
}

const API_URL = resolveApiUrl(process.env.NEXT_PUBLIC_API_URL);

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Client ID Management ────────────────────────────────────────────────────
// A UUID generated on first visit, stored in localStorage, sent on every request
// so the backend can identify the user's watchlist without authentication.

export const CLIENT_ID_KEY = 'jtl.clientId';

export function getOrCreateClientId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

// ─── Request Interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const clientId = getOrCreateClientId();
    if (clientId) {
      config.headers['x-client-id'] = clientId;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ─── Response Interceptor ────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    const message =
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      'An unexpected error occurred';

    // Re-throw with a clean error message
    const cleanError = new Error(message);
    (cleanError as Error & { statusCode?: number }).statusCode =
      error.response?.status;
    return Promise.reject(cleanError);
  },
);

export default apiClient;
