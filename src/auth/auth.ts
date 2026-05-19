export const getIdToken = () => {
  return localStorage.getItem('id_token');
};

export const isAuthenticated = () => {
  return !!getIdToken();
};

/** Subject email from Cognito ID token payload (if present). */
export const getEmailFromIdToken = (): string | null => {
  const token = getIdToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as Record<string, unknown>;
    const email = payload.email;
    if (typeof email === 'string' && email.length > 0) return email;
    const username = payload['cognito:username'];
    if (typeof username === 'string' && username.length > 0) return username;
    return null;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};
