/**
 * Shared promo helpers used by both promo-state.js and admin-update-promo.js.
 *
 * DEFAULT_PROMO  – safe fallback returned when no config is stored yet.
 * isValidPromo   – validates that a promo object has acceptable shape and values.
 */

"use strict";

const DEFAULT_PROMO = {
  active: false,
  percentOff: 50,
  label: "50% off",
};

/**
 * Validate that a promo object has acceptable shape and values.
 * Uses Number.isFinite to reject NaN/Infinity, and checks the trimmed
 * label so whitespace-only strings are rejected.
 * @param {unknown} obj
 * @returns {boolean}
 */
function isValidPromo(obj) {
  return (
    obj !== null &&
    typeof obj === "object" &&
    typeof obj.active === "boolean" &&
    typeof obj.percentOff === "number" &&
    Number.isFinite(obj.percentOff) &&
    obj.percentOff >= 1 &&
    obj.percentOff <= 99 &&
    typeof obj.label === "string" &&
    obj.label.trim().length > 0 &&
    obj.label.length <= 80
  );
}

module.exports = { DEFAULT_PROMO, isValidPromo };
