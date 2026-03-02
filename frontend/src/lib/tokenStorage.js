const ACCESS_TOKEN_KEY = 'expenses_mobile_access_token_v1';
const REFRESH_TOKEN_KEY = 'expenses_mobile_refresh_token_v1';

export const getStoredTokens = () => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY) || '';
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || '';
  return {
    accessToken,
    refreshToken,
  };
};

export const setStoredTokens = ({ accessToken, refreshToken } = {}) => {
  if (typeof accessToken === 'string') {
    if (accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  }

  if (typeof refreshToken === 'string') {
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }
};

export const clearStoredTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};
