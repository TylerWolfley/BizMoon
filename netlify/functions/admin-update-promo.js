/**
 * /.netlify/functions/admin-update-promo
 *
 * Protected POST endpoint. Accepts JSON body matching the promo config shape:
 *   { active: boolean, percentOff: number, label: string }
 *
 * Validates the session cookie before writing. Rejects malformed payloads.
 * Persists the new config to Netlify Blobs under the key "promo/config".
 */

"use strict";

const { getStore } = require("@netlify/blobs");
const { isValidPromo } = require("./_promo");
const { verifySessionToken, extractCookie } = require("./_session");

exports.handler = async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "POST", "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // --- Auth check ---
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (!sessionSecret) {
    return {
      statusCode: 503,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Admin not configured" }),
    };
  }

  const cookieHeader = event.headers["cookie"] || event.headers["Cookie"] || "";
  const token = extractCookie(cookieHeader);
  const payload = verifySessionToken(token, sessionSecret);

  if (!payload) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  // --- Parse and validate body ---
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

  // Only accept the known promo fields — strip anything unexpected
  const promo = {
    active: body.active,
    percentOff: body.percentOff,
    label: typeof body.label === "string" ? body.label.trim() : body.label,
  };

  if (!isValidPromo(promo)) {
    return {
      statusCode: 422,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error:
          "Invalid promo data. active must be boolean, percentOff must be 1–99, label must be 1–80 chars.",
      }),
    };
  }

  // --- Persist to Netlify Blobs ---
  try {
    const store = getStore("promo");
    await store.setJSON("config", promo);
  } catch (err) {
    console.error("admin-update-promo: Blob write failed", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to save promo config" }),
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, promo }),
  };
};
