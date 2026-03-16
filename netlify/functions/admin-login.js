/**
 * /.netlify/functions/admin-login
 *
 * Accepts a POST with JSON body: { password: "..." }
 * Validates the password against the ADMIN_PASSWORD environment variable.
 * On success, sets an HttpOnly signed session cookie and returns { ok: true }.
 * On failure, returns 401.
 *
 * Security notes:
 * - Password comparison uses crypto.timingSafeEqual to prevent timing attacks.
 * - Session token is signed with ADMIN_SESSION_SECRET via HMAC-SHA256.
 * - Cookie is HttpOnly, Secure (in production), SameSite=Lax.
 */

"use strict";

const crypto = require("crypto");
const {
  createSessionToken,
  buildSetCookieHeader,
} = require("./_session");

exports.handler = async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "POST", "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (!adminPassword || !sessionSecret) {
    // Misconfigured deployment — do not leak details
    console.error(
      "admin-login: ADMIN_PASSWORD or ADMIN_SESSION_SECRET not configured"
    );
    return {
      statusCode: 503,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Admin not configured" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid JSON" }),
    };
  }

  const { password } = body;
  if (typeof password !== "string" || password.length === 0) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Password required" }),
    };
  }

  // Timing-safe password comparison.
  // Always run timingSafeEqual (constant-time) before checking lengths,
  // so the length check cannot be used as a timing oracle.
  const given = Buffer.from(password);
  const expected = Buffer.from(adminPassword);
  const maxLen = Math.max(given.length, expected.length);
  const paddedGiven = Buffer.alloc(maxLen);
  const paddedExpected = Buffer.alloc(maxLen);
  given.copy(paddedGiven);
  expected.copy(paddedExpected);

  // timingSafeEqual runs unconditionally — length check is a separate boolean
  const equalContent = crypto.timingSafeEqual(paddedGiven, paddedExpected);
  const passwordMatch = given.length === expected.length && equalContent;

  if (!passwordMatch) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid password" }),
    };
  }

  const token = createSessionToken(sessionSecret);
  const cookie = buildSetCookieHeader(token);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookie,
    },
    body: JSON.stringify({ ok: true }),
  };
};
