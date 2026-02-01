// export function getClientId() {
//   if (typeof window === "undefined") return "";
//   let id = localStorage.getItem("client_id");
//   if (!id) {
//     id = crypto.randomUUID();
//     localStorage.setItem("client_id", id);
//   }
//   return id;
// }

// export function getUserColor() {
//   if (typeof window === "undefined") return "#ff00ff";
//   let c = localStorage.getItem("cursor_color");
//   if (!c) {
//     const colors = ["#ff4d4d", "#4da6ff", "#33cc33", "#ff9933", "#cc33ff"];
//     c = colors[Math.floor(Math.random() * colors.length)];
//     localStorage.setItem("cursor_color", c);
//   }
//   return c;
// }

// export function getUserName() {
//   return "User " + getClientId().slice(0, 4);
// }


// export function getClientId() {
//   if (typeof window === "undefined") return "";

//   let id = sessionStorage.getItem("client_id");
//   if (!id) {
//     id = crypto.randomUUID();
//     sessionStorage.setItem("client_id", id);
//   }
//   return id;
// }

// export function getUserColor() {
//   if (typeof window === "undefined") return "#ff00ff";

//   let c = sessionStorage.getItem("cursor_color");
//   if (!c) {
//     const colors = ["#ff4d4d", "#4da6ff", "#33cc33", "#ff9933", "#cc33ff"];
//     c = colors[Math.floor(Math.random() * colors.length)];
//     sessionStorage.setItem("cursor_color", c);
//   }
//   return c;
// }

// export function getUserName() {
//   return "User " + getClientId().slice(0, 4);
// }



// import { getUser } from "./user";

// export function getUserColor() {
//   return getUser()?.color || "#000000";
// }

// export function getUserName() {
//   return getUser()?.name || "Anonymous";
// }

// export function getUserAvatar() {
//   return getUser()?.avatar || "?";
// }



// import { v4 as uuidv4 } from "uuid";

const CLIENT_ID_KEY = "whiteboard_client_id";
const USER_COLOR_KEY = "whiteboard_user_color";
const USER_NAME_KEY = "whiteboard_user_name";
const USER_AVATAR_KEY = "whiteboard_user_avatar";

/**
 * Stable per-browser client id (used for WS + cursors)
 */
export function getClientId(): string {
  if (typeof window === "undefined") return "server";

  const id = localStorage.getItem(CLIENT_ID_KEY);
  if (id) return id;

  const newId = crypto.randomUUID();
  localStorage.setItem(CLIENT_ID_KEY, newId);
  return newId;
}

export function setClientId(id: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
}

export function clearClientId() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(CLIENT_ID_KEY);
  }
}


/**
 * Cursor color (fallback if user not logged in)
 */
export function getUserColor(): string {
  if (typeof window === "undefined") return "#000";

  let color = localStorage.getItem(USER_COLOR_KEY);
  if (!color) {
    color = randomColor();
    localStorage.setItem(USER_COLOR_KEY, color);
  }
  return color;
}

/**
 * Cursor name
 */
export function getUserName(): string {
  if (typeof window === "undefined") return "User";

  return localStorage.getItem(USER_NAME_KEY) || "User";
}

export function getUserAvatar(): string {
  if (typeof window === "undefined") return "";

  let avatar = localStorage.getItem(USER_AVATAR_KEY);

  // Use local assets now
  if (!avatar || !avatar.startsWith("/avatars/")) {
    const randomId = Math.floor(Math.random() * 10) + 1;
    avatar = `/avatars/avatar_${randomId}.svg`;
    localStorage.setItem(USER_AVATAR_KEY, avatar);
  }

  return avatar;
}

/**
 * Helpers used after login
 */
export function setUserIdentity(user: {
  name?: string;
  color?: string;
  avatar?: string;
}) {
  if (user.name) localStorage.setItem(USER_NAME_KEY, user.name);
  if (user.color) localStorage.setItem(USER_COLOR_KEY, user.color);
  if (user.avatar) localStorage.setItem(USER_AVATAR_KEY, user.avatar);
}

function randomColor() {
  const colors = [
    "#EF4444",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
