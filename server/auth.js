import jwt from "jsonwebtoken";
import { db } from "./db.js";

const SECRET =
  process.env.JWT_SECRET ||
  "fgtshdhsfkceruhnmmdmncjsncsibcbsiucnslmlsdnmcssssfefeoeufhcn";
if (!process.env.JWT_SECRET)
  console.warn(
    "Warning: JWT_SECRET is not set. Set it in server/.env before going live.",
  );

const secure =
  process.env.VERCEL === "1" || process.env.COOKIE_SECURE === "true";
const opts = () => ({ httpOnly: true, sameSite: "lax", secure, path: "/" });

export const appUrl = () => {
  if (process.env.APP_URL && !process.env.APP_URL.includes('localhost')) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, '')}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }
  if (process.env.VERCEL === '1') {
    return 'https://shyfunmi-nails.vercel.app';
  }
  return process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : 'http://localhost:5173';
};

export const setCookie = (res, u) =>
  res.cookie("token", jwt.sign({ id: u.id }, SECRET, { expiresIn: "7d" }), {
    ...opts(),
    maxAge: 7 * 864e5,
  });
export const clearCookie = (res) => res.clearCookie("token", opts());

export function attach(req, _res, next) {
  const t = req.cookies?.token;
  if (t) {
    try {
      req.user = db.users.find((u) => u.id === jwt.verify(t, SECRET).id);
    } catch {
      /* invalid token */
    }
  }
  next();
}
export const need = (req, res, next) =>
  req.user ? next() : res.status(401).json({ error: "Please sign in." });
export const adminOnly = (req, res, next) =>
  req.user?.role === "admin"
    ? next()
    : res.status(403).json({ error: "Admins only." });
export const pub = (u) =>
  u && {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone || "",
    role: u.role,
    avatar: u.avatar || "",
    provider: u.provider || "password",
    notifyEmail: u.notifyEmail !== false,
    createdAt: u.createdAt,
  };
