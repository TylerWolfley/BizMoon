/**
 * /.netlify/functions/admin-session
 *
 * GET endpoint for the admin page to check whether a valid session exists.
 * Returns { loggedIn: true } if the session cookie is valid, { loggedIn: false } otherwise.
 * Never returns a 4xx for missing/invalid sessions — the admin page handles the UI state.
 */

"use strict";

const { verifySessionToken, extractCookie } = require("./_session");

exports.handler = async function handler(event) {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { Allow: "GET", "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (!sessionSecret) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loggedIn: false }),
    };
  }

  const cookieHeader = event.headers["cookie"] || event.headers["Cookie"] || "";
  const token = extractCookie(cookieHeader);
  const payload = verifySessionToken(token, sessionSecret);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      // Never cache auth checks
      "Cache-Control": "no-store",
    },
    body: JSON.stringify({ loggedIn: payload !== null }),
  };
};
