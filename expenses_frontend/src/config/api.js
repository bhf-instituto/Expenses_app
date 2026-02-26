const DEFAULT_API_BASE_URL = 'https://bbhhffexpensesapp.dpdns.org'

function trimTrailingSlash(value) {
  if (!value) return value
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function normalizePath(path) {
  if (!path) return '/'
  return path.startsWith('/') ? path : `/${path}`
}

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL,
)

export const API_PATHS = {
  register: normalizePath(import.meta.env.VITE_AUTH_REGISTER_PATH ?? '/auth/register'),
  login: normalizePath(import.meta.env.VITE_AUTH_LOGIN_PATH ?? '/auth/login'),
  logout: normalizePath(import.meta.env.VITE_AUTH_LOGOUT_PATH ?? '/auth/logout'),
  me: normalizePath(import.meta.env.VITE_AUTH_ME_PATH ?? '/health/me'),
  health: normalizePath(import.meta.env.VITE_HEALTH_PATH ?? '/health/me'),
}
