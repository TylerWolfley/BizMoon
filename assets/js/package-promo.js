/**
 * Package promo renderer.
 *
 * Listens for the "bizmoon:promo-ready" event fired by promo-config.js once the
 * live promo state has been fetched. Renders promo pricing (or base pricing) for
 * every element with data-price-type="package".
 *
 * The render function is idempotent: a data-promo-rendered attribute tracks the
 * last-rendered state so identical re-runs are skipped.
 */
(function () {
  const fmtFull = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const fmtSale = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  /**
   * Render promo pricing (or base pricing) for all package price elements.
   * Called once the promo state is known (via the bizmoon:promo-ready event).
   * @param {{ active: boolean, percentOff: number, label: string }} promo
   */
  function renderPromo(promo) {
    if (!promo) return;

    // Global page state hook — enables promo-scoped CSS without layout changes
    document.documentElement.classList.toggle("promo-active", promo.active);
    document.documentElement.classList.toggle("promo-inactive", !promo.active);

    const elements = document.querySelectorAll('[data-price-type="package"]');

    elements.forEach(function (el) {
      const basePrice = parseFloat(el.getAttribute("data-base-price"));
      if (isNaN(basePrice)) return;

      // Idempotency guard: skip if already rendered in the current promo state
      const desiredState = promo.active ? "active" : "inactive";
      if (el.getAttribute("data-promo-rendered") === desiredState) return;
      el.setAttribute("data-promo-rendered", desiredState);

      if (promo.active) {
        const rawSale = basePrice * (1 - promo.percentOff / 100);
        const salePrice = Math.round(rawSale * 100) / 100;

        // Build promo markup with DOM methods — no innerHTML
        const stack = document.createElement("span");
        stack.className = "price-stack";

        // Badge: decorative label, hidden from assistive technology
        const badge = document.createElement("span");
        badge.className = "promo-badge";
        badge.setAttribute("aria-hidden", "true");
        badge.textContent = promo.label;

        // Original price: visually struck-through, hidden from assistive technology
        const original = document.createElement("span");
        original.className = "price-original";
        original.setAttribute("aria-hidden", "true");
        original.textContent = fmtFull.format(basePrice);

        // Sale price: the primary readable value for all users
        const sale = document.createElement("strong");
        sale.className = "price-sale";
        sale.textContent = fmtSale.format(salePrice);

        stack.appendChild(badge);
        stack.appendChild(original);
        stack.appendChild(sale);

        // Clear any prior content (covers re-runs) then insert fresh markup
        el.textContent = "";
        el.appendChild(stack);
      } else {
        // textContent assignment safely removes any prior promo markup
        el.textContent = fmtFull.format(basePrice);
      }
    });
  }

  // Wait for promo-config.js to fire the ready event after its async fetch completes.
  // This ensures we always render with the live server state, not a stale default.
  document.addEventListener("bizmoon:promo-ready", function (event) {
    renderPromo(event.detail);
  });
}());

