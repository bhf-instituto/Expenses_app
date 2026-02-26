const TOKEN_STORAGE_KEY = 'expenses_auth_token'

export const tokenStorage = {
  get() {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  },
  set(token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  },
  clear() {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  },
}
