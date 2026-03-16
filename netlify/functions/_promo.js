/**
 * Shared promo validation and default state.
 * Used by promo-state.js (read) and admin-update-promo.js (write).
 */

"use strict";

const DEFAULT_PROMO = {
  active: false,
  percentOff: 50,
  label: "50% off",
};

/**
 * Validate a promo config object.
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
