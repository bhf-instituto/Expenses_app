import { getStoredTokens } from './tokenStorage.js';

class ApiError extends Error {
  constructor(message, status, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim();

const toAbsoluteUrl = (path, query = {}) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = API_BASE_URL || window.location.origin;
  const url = new URL(normalizedPath, base);

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });

  return url.toString();
};

const parseResponse = async (response) => {
  const payload = await response.json().catch(() => null);
  const message = payload?.data?.message || payload?.message || 'request failed';

  if (!response.ok || payload?.ok === false) {
    throw new ApiError(message, response.status, payload);
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return payload.data;
  }

  return payload;
};

const request = async (path, { method = 'GET', body, query } = {}) => {
  const { accessToken, refreshToken } = getStoredTokens();
  const headers = body ? { 'Content-Type': 'application/json' } : {};

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  if (refreshToken) {
    headers['X-Refresh-Token'] = refreshToken;
  }

  const response = await fetch(toAbsoluteUrl(path, query), {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  return parseResponse(response);
};

export const healthApi = {
  me: () => request('/health/me'),
};

export const authApi = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  logout: () => request('/auth/logout', { method: 'POST' }),
};

export const setsApi = {
  getAll: () => request('/sets'),
  getById: (setId) => request(`/sets/${setId}`),
  getUsers: (setId) => request(`/sets/${setId}/users`),
  create: (payload) => request('/sets', { method: 'POST', body: payload }),
  update: (setId, payload) => request(`/sets/${setId}`, { method: 'PUT', body: payload }),
  delete: (setId) => request(`/sets/${setId}`, { method: 'DELETE' }),
  removeUser: (setId, userId, payload) =>
    request(`/sets/${setId}/users/${userId}`, { method: 'DELETE', body: payload }),
};

export const categoriesApi = {
  getAll: (setId, expenseType) =>
    request(`/sets/${setId}/categories`, {
      query: { expense_type: expenseType },
    }),
  create: (setId, payload) => request(`/sets/${setId}/categories`, { method: 'POST', body: payload }),
  update: (categoryId, payload) => request(`/categories/${categoryId}`, { method: 'PUT', body: payload }),
  delete: (categoryId) => request(`/categories/${categoryId}`, { method: 'DELETE' }),
};

export const expensesApi = {
  create: (setId, payload) => request(`/sets/${setId}/expenses`, { method: 'POST', body: payload }),
  getAll: (setId, query) => request(`/sets/${setId}/expenses`, { query }),
  update: (expenseId, payload) => request(`/expenses/${expenseId}`, { method: 'PUT', body: payload }),
  delete: (expenseId) => request(`/expenses/${expenseId}`, { method: 'DELETE' }),
};

export const inviteApi = {
  create: (setId, payload) => request(`/invite/${setId}`, { method: 'POST', body: payload }),
  accept: (payload) => request('/invite', { method: 'POST', body: payload }),
};

export { ApiError };
