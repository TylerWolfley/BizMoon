/**
 * Shared session signing and verification utilities.
 *
 * Sessions are represented as a simple signed token stored in an HttpOnly cookie.
 * Format: <base64url(payload)>.<base64url(HMAC-SHA256 signature)>
 *
 * We use Node's built-in `crypto` module — no external auth libraries required.
 */

"use strict";

const crypto = require("crypto");

// How long a session token remains valid (1 day in seconds)
const SESSION_MAX_AGE_S = 60 * 60 * 24;

const COOKIE_NAME = "bizmoon_admin";

/**
 * Create a signed session token for the admin user.
 * @param {string} secret  ADMIN_SESSION_SECRET environment variable value
 * @returns {string}       Signed token string
 */
function createSessionToken(secret) {
  const payload = JSON.stringify({
    sub: "admin",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_S,
  });
  const b64Payload = Buffer.from(payload).toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret)
    .update(b64Payload)
    .digest("base64url");
  return `${b64Payload}.${sig}`;
}

/**
 * Verify a session token and return the decoded payload, or null if invalid/expired.
 * Uses timing-safe comparison to prevent timing attacks.
 * @param {string} token   Token from cookie
 * @param {string} secret  ADMIN_SESSION_SECRET environment variable value
 * @returns {{ sub: string, iat: number, exp: number } | null}
 */
function verifySessionToken(token, secret) {
  if (!token || typeof token !== "string") return null;

  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const b64Payload = token.slice(0, dotIndex);
  const receivedSig = token.slice(dotIndex + 1);

  // Recompute expected signature
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(b64Payload)
    .digest("base64url");

  // Timing-safe comparison — both buffers must be the same length
  let sigValid = false;
  try {
    const a = Buffer.from(receivedSig, "base64url");
    const b = Buffer.from(expectedSig, "base64url");
    sigValid = a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return null;
  }

  if (!sigValid) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(b64Payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  // Check expiry and required payload shape
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
  if (payload.sub !== "admin") return null;

  return payload;
}

/**
 * Extract the session token from an incoming request's Cookie header.
 * @param {string|undefined} cookieHeader  The Cookie request header value
 * @returns {string|null}
 */
function extractCookie(cookieHeader) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name.trim() === COOKIE_NAME) {
      return decodeURIComponent(rest.join("=").trim());
    }
  }
  return null;
}

/**
 * Build a Set-Cookie header string that sets the admin session cookie.
 * Secure flag is added only in production (Netlify sets NETLIFY=true but not NETLIFY_LOCAL).
 * During local `netlify dev`, NETLIFY_LOCAL=true so Secure is omitted to allow HTTP.
 * @param {string} token  Signed session token
 * @returns {string}
 */
function buildSetCookieHeader(token) {
  // In production Netlify: NETLIFY=true and NETLIFY_LOCAL is unset.
  // During `netlify dev`: NETLIFY=true but NETLIFY_LOCAL=true — no Secure flag so
  // cookies work over HTTP localhost.
  const isProduction =
    process.env.NETLIFY === "true" && !process.env.NETLIFY_LOCAL;
  const secure = isProduction ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE_S}`;
}

/**
 * Build a Set-Cookie header string that clears the admin session cookie.
 * @returns {string}
 */
function buildClearCookieHeader() {
  const isProduction =
    process.env.NETLIFY === "true" && !process.env.NETLIFY_LOCAL;
  const secure = isProduction ? "; Secure" : "";
  return `${COOKIE_NAME}=; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=0`;
}

module.exports = {
  createSessionToken,
  verifySessionToken,
  extractCookie,
  buildSetCookieHeader,
  buildClearCookieHeader,
  SESSION_MAX_AGE_S,
};
