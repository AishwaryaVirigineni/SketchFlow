export type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  color?: string | null;
};

const TOKEN_KEY = "whiteboard_token";
const USER_KEY = "whiteboard_user";

/**
 * Token helpers
 */
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

/**
 * User helpers
 */
export function setUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

/**
 * Fetch wrapper with auth
 */
export async function authFetch(
  input: RequestInfo,
  init: RequestInit = {}
) {
  const token = getToken();

  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
  });
}
