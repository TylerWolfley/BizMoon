/**
 * Shared promo config helpers.
 *
 * Used by promo-state.js (read) and admin-update-promo.js (write) to keep
 * the canonical default value and validation logic in one place.
 */

"use strict";

/** Safe fallback returned when no promo config has been persisted yet. */
const DEFAULT_PROMO = {
  active: false,
  percentOff: 50,
  label: "50% off",
};

/**
 * Validate that a promo object has the expected shape and sane values.
 * Used both when reading from Blob storage and when accepting a write request.
 *
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
