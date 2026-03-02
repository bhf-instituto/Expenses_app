export const DEFAULT_SESSION_SCOPE = 'global';

export const resolveSessionScope = (user) => {
  const rawId = user?.id;
  if (rawId !== undefined && rawId !== null) {
    const normalizedId = String(rawId).trim();
    if (normalizedId) {
      return `id:${normalizedId}`;
    }
  }

  const normalizedEmail = String(user?.email || '').trim().toLowerCase();
  if (normalizedEmail) {
    return `email:${normalizedEmail}`;
  }

  return DEFAULT_SESSION_SCOPE;
};
