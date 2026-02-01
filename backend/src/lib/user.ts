export type User = {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
};

const USER_KEY = "whiteboard_user";

export function setUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
}

// lib/user.ts
export function getUserAvatar() {
  const u = JSON.parse(localStorage.getItem("whiteboard_user") || "{}");
  return u.avatar;
}
