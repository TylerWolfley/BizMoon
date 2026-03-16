/**
 * /.netlify/functions/admin-logout
 *
 * POST endpoint. Clears the admin session cookie by overwriting it with
 * an expired empty value. No auth required — clearing a cookie is always safe.
 */

"use strict";

const { buildClearCookieHeader } = require("./_session");

exports.handler = async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "POST", "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": buildClearCookieHeader(),
      "Cache-Control": "no-store",
    },
    body: JSON.stringify({ ok: true }),
  };
};
