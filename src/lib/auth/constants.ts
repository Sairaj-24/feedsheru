export const SESSION_COOKIE = "feedsheru_session";
export const SESSION_DAYS = 14;
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;
export const MIN_PASSWORD_LENGTH = 8;

export function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set. Copy .env.example to .env.local.");
  }
  return secret;
}

/** Session cookies are Secure in production unless AUTH_COOKIE_SECURE=false (HTTP Compose). */
export function sessionCookieSecure() {
  const raw = process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase();
  if (raw === "0" || raw === "false") return false;
  if (raw === "1" || raw === "true") return true;
  return process.env.NODE_ENV === "production";
}
