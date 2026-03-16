/**
 * /.netlify/functions/promo-state
 *
 * Public read-only endpoint. Returns the current promo configuration as JSON.
 * Used by public pages to dynamically load promo state without a redeploy.
 *
 * If Blob storage has no entry yet (first run), returns the safe default:
 *   { active: false, percentOff: 50, label: "50% off" }
 */

"use strict";

const { getStore } = require("@netlify/blobs");

const DEFAULT_PROMO = {
  active: false,
  percentOff: 50,
  label: "50% off",
};

/** Validate that a promo object has acceptable shape and values. */
function isValidPromo(obj) {
  return (
    obj !== null &&
    typeof obj === "object" &&
    typeof obj.active === "boolean" &&
    typeof obj.percentOff === "number" &&
    obj.percentOff >= 1 &&
    obj.percentOff <= 99 &&
    typeof obj.label === "string" &&
    obj.label.length > 0 &&
    obj.label.length <= 80
  );
}

exports.handler = async function handler(event) {
  // Only GET is supported
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { Allow: "GET", "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  let promo = DEFAULT_PROMO;

  try {
    const store = getStore("promo");
    const stored = await store.get("config", { type: "json" });
    if (stored !== null && isValidPromo(stored)) {
      promo = stored;
    }
  } catch {
    // Blob storage unavailable (e.g. local dev without netlify dev).
    // Return the default so public pages still render base prices.
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      // Allow public caching for a short time; CDN edge workers revalidate quickly
      "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
    },
    body: JSON.stringify(promo),
  };
};
