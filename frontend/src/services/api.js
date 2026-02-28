const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.ok === false) {
    throw new Error(payload?.data?.message || payload?.message || 'Error de API');
  }

  return payload;
}

export const api = {
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/health/me'),
  sets: () => request('/sets'),
  createSet: (set_name) => request('/sets', { method: 'POST', body: JSON.stringify({ set_name }) }),
  categoriesBySet: (setId, expense_type) =>
    request(`/sets/${setId}/categories${expense_type ? `?expense_type=${expense_type}` : ''}`),
  createCategory: (setId, body) => request(`/sets/${setId}/categories`, { method: 'POST', body: JSON.stringify(body) }),
  createExpense: (setId, body) => request(`/sets/${setId}/expenses`, { method: 'POST', body: JSON.stringify(body) }),
  listExpenses: (setId, params = '') => request(`/sets/${setId}/expenses${params ? `?${params}` : ''}`)
};
