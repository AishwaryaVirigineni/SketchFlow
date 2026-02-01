import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET)
    throw new Error("JWT_SECRET is not defined");
export function signAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
export function verifyAccessToken(token) {
    return jwt.verify(token, JWT_SECRET);
}
export const AUTH_COOKIE = "wb_token";
export function cookieOptions() {
    const isProd = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        secure: isProd, // true only in prod (https)
        sameSite: (isProd ? "none" : "lax"),
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
}
export function getTokenFromRequest(req) {
    const token = req.cookies?.[AUTH_COOKIE];
    if (token && typeof token === "string")
        return token;
    const auth = req.headers.authorization;
    if (auth && auth.startsWith("Bearer "))
        return auth.slice("Bearer ".length);
    return null;
}
export const TOKEN_KEY = "whiteboard_token";
export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}
export function getToken() {
    if (typeof window === "undefined")
        return null;
    return localStorage.getItem(TOKEN_KEY);
}
export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}
export function isLoggedIn() {
    return !!getToken();
}
