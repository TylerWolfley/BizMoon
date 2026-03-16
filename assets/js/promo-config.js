/**
 * Promo loader — replaces the old static config.
 *
 * Flow:
 *  1. Sets a safe default so package-promo.js can render base prices immediately.
 *  2. Fetches live promo state from /.netlify/functions/promo-state (same origin).
 *  3. Updates window.BIZMOON_PROMO and fires the "bizmoon:promo-ready" custom event
 *     so package-promo.js can re-render if the live state differs from the default.
 *  4. If the fetch fails (network error, function unavailable), the default stays in
 *     place and base prices remain visible — no broken UI.
 */
(function () {
  // Safe default: promo inactive, so base prices always show immediately.
  window.BIZMOON_PROMO = {
    active: false,
    percentOff: 50,
    label: "50% off",
  };

  function dispatchPromoReady() {
    document.dispatchEvent(
      new CustomEvent("bizmoon:promo-ready", {
        detail: window.BIZMOON_PROMO,
      })
    );
  }

  // Fetch live promo state from the Netlify Function (same-origin, no CSP change needed)
  fetch("/.netlify/functions/promo-state")
    .then(function (response) {
      if (!response.ok) throw new Error("promo-state: " + response.status);
      return response.json();
    })
    .then(function (data) {
      if (
        data &&
        typeof data.active === "boolean" &&
        typeof data.percentOff === "number" &&
        typeof data.label === "string"
      ) {
        window.BIZMOON_PROMO = data;
      }
      dispatchPromoReady();
    })
    .catch(function () {
      // Fetch failed — fire the event anyway so package-promo.js renders base prices.
      dispatchPromoReady();
    });
}());

